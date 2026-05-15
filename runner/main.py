"""
LATHE — Latency-Aware Test Harness for Voice AI
Run: python runner/main.py [--runs N] [--providers a,b] [--categories x,y]
"""

import argparse
import asyncio
import json
import math
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from .providers.base import Provider, SynthesisResult
from .providers.groq import GroqProvider
from .providers.smallest import SmallestProvider
from .providers.sarvam import SarvamProvider

load_dotenv()

CORPUS_PATH = Path(__file__).parent.parent / "tests" / "corpus.json"
RESULTS_PATH = Path(__file__).parent.parent / "dashboard" / "public" / "results.json"

PROVIDERS: list[type[Provider]] = [
    GroqProvider,
    SmallestProvider,
    SarvamProvider,
]
SEMAPHORE_LIMIT = 6
SCHEMA_VERSION = 2
DEFAULT_RUNS = 5
RETRY_ATTEMPTS = 2
RETRY_BACKOFF_S = 1.5


def log(provider: str, test_id: str, event: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{provider}] [{test_id}] {event}", flush=True)


def load_corpus() -> list[dict]:
    if not CORPUS_PATH.exists():
        print(f"ERROR: corpus not found at {CORPUS_PATH}", file=sys.stderr)
        sys.exit(1)
    with CORPUS_PATH.open(encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return [_normalize(item, "unknown") for item in data]
    if isinstance(data, dict) and "tests" in data:
        return [_normalize(item, "unknown") for item in data["tests"]]
    if isinstance(data, dict) and "categories" in data:
        items: list[dict] = []
        for cat_name, cat_body in data["categories"].items():
            for item in cat_body.get("tests", []):
                items.append(_normalize(item, cat_name))
        return items
    print("ERROR: unrecognized corpus.json shape", file=sys.stderr)
    sys.exit(1)


def _normalize(item: dict, default_category: str) -> dict:
    text = item.get("text")
    test_id = item.get("test_id") or item.get("id")
    if not text or not test_id:
        raise ValueError(f"corpus entry missing test_id or text: {item}")
    return {
        "test_id": test_id,
        "category": item.get("category", default_category),
        "text": text,
        "expected_behavior": item.get("expected_behavior", ""),
    }


async def _synth_with_retry(
    provider: Provider, text: str, test_id: str, sample_idx: int
) -> SynthesisResult:
    last: SynthesisResult | None = None
    for attempt in range(RETRY_ATTEMPTS + 1):
        result = await provider.synthesize(text, test_id, sample_idx=sample_idx)
        if result.error is None:
            return result
        last = result
        # Don't retry on auth/billing failures — they won't recover.
        err = result.error or ""
        if any(code in err for code in ("HTTP 401", "HTTP 402", "HTTP 403", "HTTP 404")):
            return result
        if attempt < RETRY_ATTEMPTS:
            await asyncio.sleep(RETRY_BACKOFF_S * (attempt + 1))
    return last  # type: ignore[return-value]


async def run_cell(
    sem: asyncio.Semaphore,
    provider: Provider,
    text: str,
    test_id: str,
    runs: int,
) -> list[SynthesisResult]:
    """Run N samples for one (provider, test) cell, sequentially within the cell.

    Sequential within the cell so connection reuse and rate limits work cleanly.
    Cells run concurrently across (provider × test) via the outer gather.
    """
    out: list[SynthesisResult] = []
    async with sem:
        # Warm-up: one untimed call to establish connection (only when N>1).
        if runs > 1:
            await provider.synthesize(text, test_id, sample_idx=-1)
        for i in range(runs):
            result = await _synth_with_retry(provider, text, test_id, sample_idx=i)
            if result.error:
                log(provider.name, test_id, f"sample {i+1}/{runs} ERROR — {result.error[:120]}")
            else:
                log(
                    provider.name,
                    test_id,
                    f"sample {i+1}/{runs} ttfb={result.ttfb_ms}ms total={result.total_ms}ms",
                )
            out.append(result)
    return out


def _percentile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    k = (len(s) - 1) * q
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return s[int(k)]
    return s[f] + (s[c] - s[f]) * (k - f)


def _stats(values: list[float]) -> dict | None:
    if not values:
        return None
    return {
        "mean": round(statistics.fmean(values), 2),
        "p50": round(_percentile(values, 0.50), 2),
        "p95": round(_percentile(values, 0.95), 2),
        "min": round(min(values), 2),
        "max": round(max(values), 2),
        "stddev": round(statistics.pstdev(values), 2) if len(values) > 1 else 0.0,
        "samples": [round(v, 2) for v in values],
    }


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="LATHE — TTS latency benchmark.")
    p.add_argument("--runs", type=int, default=DEFAULT_RUNS, help="samples per (provider, test)")
    p.add_argument("--providers", type=str, default="", help="comma-separated provider names")
    p.add_argument("--categories", type=str, default="", help="comma-separated category names")
    p.add_argument("--merge", action="store_true", help="merge results into existing results.json instead of replacing")
    return p.parse_args()


async def main() -> None:
    args = _parse_args()

    corpus = load_corpus()
    if args.categories:
        wanted = {c.strip() for c in args.categories.split(",") if c.strip()}
        corpus = [c for c in corpus if c["category"] in wanted]

    selected_classes = PROVIDERS
    if args.providers:
        wanted = {p.strip() for p in args.providers.split(",") if p.strip()}
        selected_classes = [c for c in PROVIDERS if c.name in wanted]

    print(f"Loaded {len(corpus)} tests · runs={args.runs} · providers={[c.name for c in selected_classes]}", flush=True)

    # Instantiate providers once (shared httpx client per provider).
    instances: list[Provider] = []
    skipped: list[str] = []
    for cls in selected_classes:
        try:
            instances.append(cls())
        except RuntimeError as exc:
            log("INIT", cls.name, f"SKIP — {exc}")
            skipped.append(cls.name)

    sem = asyncio.Semaphore(SEMAPHORE_LIMIT)

    try:
        tasks = [
            run_cell(sem, provider, item["text"], item["test_id"], args.runs)
            for item in corpus
            for provider in instances
        ]
        cells: list[list[SynthesisResult]] = await asyncio.gather(*tasks, return_exceptions=False)
    finally:
        for p in instances:
            await p.aclose()

    # Group: { test_id -> { provider -> [SynthesisResult, ...] } }
    by_test: dict[str, dict[str, list[SynthesisResult]]] = {}
    idx = 0
    for item in corpus:
        by_test[item["test_id"]] = {}
        for provider in instances:
            by_test[item["test_id"]][provider.name] = cells[idx]
            idx += 1
        for name in skipped:
            by_test[item["test_id"]][name] = [
                SynthesisResult(
                    provider=name,
                    test_id=item["test_id"],
                    ttfb_ms=None,
                    total_ms=None,
                    audio_path=None,
                    audio_format=None,
                    error="skipped — API key not configured",
                )
            ]

    grouped: list[dict] = []
    for item in corpus:
        outputs: dict[str, dict] = {}
        for provider_name, samples in by_test[item["test_id"]].items():
            ttfbs = [s.ttfb_ms for s in samples if s.ttfb_ms is not None]
            totals = [s.total_ms for s in samples if s.total_ms is not None]
            errors = [s.error for s in samples if s.error]
            audio_sample = next((s for s in samples if s.audio_path), None)
            outputs[provider_name] = {
                "ttfb": _stats(ttfbs),
                "total": _stats(totals),
                "audio_path": audio_sample.audio_path if audio_sample else None,
                "audio_format": audio_sample.audio_format if audio_sample else None,
                "runs": len(samples),
                "errors": len(errors),
                "last_error": errors[-1] if errors else None,
                "is_streaming": next(
                    (cls.is_streaming for cls in PROVIDERS if cls.name == provider_name), True
                ),
            }
        grouped.append({
            "test_id": item["test_id"],
            "category": item["category"],
            "text": item["text"],
            "expected_behavior": item["expected_behavior"],
            "outputs": outputs,
        })

    run_id = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")

    if args.merge and RESULTS_PATH.exists():
        with RESULTS_PATH.open(encoding="utf-8") as f:
            existing = json.load(f)
        # Build lookup of new results by test_id
        new_by_id = {r["test_id"]: r for r in grouped}
        for row in existing["results"]:
            tid = row["test_id"]
            if tid in new_by_id:
                row["outputs"].update(new_by_id[tid]["outputs"])
        all_providers = list(dict.fromkeys(existing.get("providers", []) + [p.name for p in instances]))
        output = {**existing, "providers": all_providers, "generated_at": datetime.now(timezone.utc).isoformat()}
        output["results"] = existing["results"]
    else:
        output = {
            "schema_version": SCHEMA_VERSION,
            "run_id": run_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "runs_per_cell": args.runs,
            "providers": [p.name for p in instances] + skipped,
            "skipped_providers": skipped,
            "results": grouped,
        }

    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with RESULTS_PATH.open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nResults written to {RESULTS_PATH}", flush=True)
    print(f"Run ID: {run_id}", flush=True)

    # Summary table
    print("\n--- SUMMARY ---")
    for provider in instances:
        all_ttfbs: list[float] = []
        all_errs = 0
        for item in corpus:
            samples = by_test[item["test_id"]][provider.name]
            all_ttfbs.extend(s.ttfb_ms for s in samples if s.ttfb_ms is not None)
            all_errs += sum(1 for s in samples if s.error)
        if all_ttfbs:
            p50 = _percentile(all_ttfbs, 0.50)
            p95 = _percentile(all_ttfbs, 0.95)
            print(f"  {provider.name:12s}  p50_ttfb={p50:.0f}ms  p95_ttfb={p95:.0f}ms  errors={all_errs}")
        else:
            print(f"  {provider.name:12s}  no successful calls  errors={all_errs}")


if __name__ == "__main__":
    asyncio.run(main())
