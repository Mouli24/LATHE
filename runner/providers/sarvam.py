import base64
import io
import os
import time
import wave

from .base import AUDIO_OUT_BASE, Provider, SynthesisResult

_SARVAM_SAMPLE_RATE = 22050  # Bulbul v2 returns 22050 Hz 16-bit mono PCM


def _pcm_to_wav(pcm: bytes, sample_rate: int = _SARVAM_SAMPLE_RATE) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)  # 16-bit
        w.setframerate(sample_rate)
        w.writeframes(pcm)
    return buf.getvalue()


def _ensure_wav(data: bytes) -> bytes:
    """Wrap raw PCM in a WAV container if the RIFF header is missing."""
    if data[:4] == b"RIFF":
        return data
    return _pcm_to_wav(data)


class SarvamProvider(Provider):
    """Sarvam AI Bulbul TTS — built for Indian languages.

    Note: Sarvam's REST endpoint returns full base64-encoded audio in a single
    JSON response, not a streaming chunked body. TTFB ~ total_ms for this provider.
    """

    name = "sarvam"
    is_streaming = False

    def __init__(self) -> None:
        api_key = os.environ.get("SARVAM_API_KEY")
        if not api_key:
            raise RuntimeError("SARVAM_API_KEY not set")
        super().__init__()
        self._api_key = api_key
        self._speaker = os.environ.get("SARVAM_SPEAKER", "anushka")
        self._model = os.environ.get("SARVAM_MODEL", "bulbul:v2")
        self._lang = os.environ.get("SARVAM_LANG", "hi-IN")

    async def synthesize(self, text: str, test_id: str, sample_idx: int = 0) -> SynthesisResult:
        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "API-Subscription-Key": self._api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "inputs": [text],
            "target_language_code": self._lang,
            "speaker": self._speaker,
            "model": self._model,
            "enable_preprocessing": True,
        }

        out_dir = AUDIO_OUT_BASE / self.name
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{test_id}.wav"
        relative_path = f"audio/{self.name}/{test_id}.wav"

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
                chunks: list[bytes] = []
                async for chunk in resp.aiter_bytes(chunk_size=4096):
                    if not chunks:
                        ttfb_ms = (time.perf_counter() - t_start) * 1000
                    chunks.append(chunk)

            total_ms = (time.perf_counter() - t_start) * 1000
            body = b"".join(chunks)

            if not body:
                return SynthesisResult(
                    provider=self.name,
                    test_id=test_id,
                    ttfb_ms=None,
                    total_ms=None,
                    audio_path=None,
                    audio_format=None,
                    error="empty response body",
                )

            import json as _json
            data = _json.loads(body.decode("utf-8"))
            audios = data.get("audios") or []
            if not audios:
                return SynthesisResult(
                    provider=self.name,
                    test_id=test_id,
                    ttfb_ms=None,
                    total_ms=None,
                    audio_path=None,
                    audio_format=None,
                    error=f"no audio returned: {str(data)[:200]}",
                )

            if sample_idx == 0:
                out_path.write_bytes(_ensure_wav(base64.b64decode(audios[0])))

            return SynthesisResult(
                provider=self.name,
                test_id=test_id,
                ttfb_ms=round(ttfb_ms, 2) if ttfb_ms is not None else None,
                total_ms=round(total_ms, 2),
                audio_path=relative_path,
                audio_format="wav",
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
