from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path

import httpx

AUDIO_OUT_BASE = Path(__file__).parent.parent.parent / "dashboard" / "public" / "audio"


@dataclass
class SynthesisResult:
    provider: str
    test_id: str
    ttfb_ms: float | None
    total_ms: float | None
    audio_path: str | None      # relative: "audio/deepgram/hng_001.mp3"
    audio_format: str | None    # "mp3", "wav", etc.
    error: str | None


class Provider(ABC):
    name: str
    is_streaming: bool = True   # False means TTFB ~= total_ms (single-shot response)

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=60.0)

    async def aclose(self) -> None:
        await self._client.aclose()

    @abstractmethod
    async def synthesize(self, text: str, test_id: str, sample_idx: int = 0) -> SynthesisResult:
        ...
