import os
import time

from .base import AUDIO_OUT_BASE, Provider, SynthesisResult


class SmallestProvider(Provider):
    name = "smallest"
    is_streaming = True

    def __init__(self) -> None:
        api_key = os.environ.get("SMALLEST_API_KEY")
        if not api_key:
            raise RuntimeError("SMALLEST_API_KEY not set")
        super().__init__()
        self._api_key = api_key
        self._voice_id = os.environ.get("SMALLEST_VOICE_ID", "emily")

    async def synthesize(self, text: str, test_id: str, sample_idx: int = 0) -> SynthesisResult:
        url = "https://waves-api.smallest.ai/api/v1/lightning/get_speech"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
            "voice_id": self._voice_id,
            "sample_rate": 24000,
        }

        out_dir = AUDIO_OUT_BASE / self.name
        out_dir.mkdir(parents=True, exist_ok=True)

        t_start = time.perf_counter()
        ttfb_ms: float | None = None

        try:
            async with self._client.stream("POST", url, headers=headers, json=payload) as resp:
                if resp.status_code >= 400:
                    body = await resp.aread()
                    return SynthesisResult(
                        provider=self.name,
                        test_id=test_id,
                        ttfb_ms=None,
                        total_ms=None,
                        audio_path=None,
                        audio_format=None,
                        error=f"HTTP {resp.status_code}: {body.decode('utf-8', errors='replace')[:200]}",
                    )
                content_type = resp.headers.get("content-type", "")
                ext = "wav" if "wav" in content_type else "mp3"
                out_path = out_dir / f"{test_id}.{ext}"
                relative_path = f"audio/{self.name}/{test_id}.{ext}"

                chunks: list[bytes] = []
                async for chunk in resp.aiter_bytes(chunk_size=4096):
                    if not chunks:
                        ttfb_ms = (time.perf_counter() - t_start) * 1000
                    chunks.append(chunk)

            total_ms = (time.perf_counter() - t_start) * 1000
            audio_bytes = b"".join(chunks)
            if sample_idx == 0:
                out_path.write_bytes(audio_bytes)

            if not audio_bytes:
                return SynthesisResult(
                    provider=self.name,
                    test_id=test_id,
                    ttfb_ms=None,
                    total_ms=None,
                    audio_path=None,
                    audio_format=None,
                    error="empty response body",
                )

            return SynthesisResult(
                provider=self.name,
                test_id=test_id,
                ttfb_ms=round(ttfb_ms, 2) if ttfb_ms is not None else None,
                total_ms=round(total_ms, 2),
                audio_path=relative_path,
                audio_format=ext,
                error=None,
            )
        except Exception as exc:
            return SynthesisResult(
                provider=self.name,
                test_id=test_id,
                ttfb_ms=None,
                total_ms=None,
                audio_path=None,
                audio_format=None,
                error=str(exc),
            )
