"""
One-shot script: prepend WAV (RIFF) headers to every raw-PCM file in
dashboard/public/audio/ that is missing one.

Both Smallest.ai and Sarvam stream back bare 16-bit signed PCM bytes —
they never include a RIFF container, so browsers can't play the files.

Sample-rate map (derived from provider source code / API docs):
  smallest : 24000 Hz
  sarvam   : 22050 Hz

Run once from the repo root:
  python runner/fix_audio_headers.py
"""

import struct
import sys
from pathlib import Path

AUDIO_BASE = Path(__file__).parent.parent / "dashboard" / "public" / "audio"

# (sample_rate_hz, channels, bits_per_sample)
PROVIDER_FORMAT: dict[str, tuple[int, int, int]] = {
    "smallest": (24000, 1, 16),
    "sarvam":   (22050, 1, 16),
}


def has_riff_header(data: bytes) -> bool:
    return data[:4] == b"RIFF" and data[8:12] == b"WAVE"


def make_wav_header(pcm_len: int, sample_rate: int, channels: int, bits_per_sample: int) -> bytes:
    byte_rate = sample_rate * channels * bits_per_sample // 8
    block_align = channels * bits_per_sample // 8
    data_chunk_size = pcm_len
    riff_size = 36 + data_chunk_size  # bytes after "RIFF" + size field

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        riff_size,
        b"WAVE",
        b"fmt ",
        16,               # PCM fmt chunk size
        1,                # audio format = PCM
        channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_chunk_size,
    )
    return header


def fix_provider(provider: str, sample_rate: int, channels: int, bits: int) -> None:
    folder = AUDIO_BASE / provider
    if not folder.exists():
        print(f"  [skip] {provider}: folder not found")
        return

    files = sorted(folder.glob("*.wav"))
    fixed = 0
    skipped = 0

    for wav_path in files:
        raw = wav_path.read_bytes()
        if has_riff_header(raw):
            skipped += 1
            continue
        header = make_wav_header(len(raw), sample_rate, channels, bits)
        wav_path.write_bytes(header + raw)
        fixed += 1

    print(f"  {provider}: fixed {fixed} file(s), {skipped} already valid")


def main() -> None:
    print(f"Audio base: {AUDIO_BASE}")
    for provider, (sr, ch, bits) in PROVIDER_FORMAT.items():
        fix_provider(provider, sr, ch, bits)
    print("Done.")


if __name__ == "__main__":
    main()
