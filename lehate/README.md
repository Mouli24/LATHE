# LATHE — Latency-Aware Test Harness for Voice AI

**The first open benchmark for voice AI on Indian-language workloads.**

Most TTS benchmarks are built on clean US-English sentences. Indian production voice agents deal with Hinglish code-switching, 12-digit IFSC codes, South Indian names with 4+ syllables, and OTP readbacks where a single digit error is a compliance incident. LATHE measures what actually matters for these workloads: latency.

---

## Headline Findings

Each cell is run **5×** and reported as `p50 / p95` TTFB in milliseconds. Lower is better. Numbers populated by the most recent benchmark run live in [`dashboard/public/results.json`](dashboard/public/results.json) and are visualized on the dashboard.

| Provider     | p50 TTFB | p95 TTFB | Notes                              |
|--------------|---------:|---------:|------------------------------------|
| Sarvam AI    |        — |        — | Indian-language-native; non-stream |
| Smallest.ai  |        — |        — | Lightning V3                       |
| ElevenLabs   |        — |        — | Turbo v2.5 (streaming)             |

> Run `python runner/main.py --runs 5` then open the dashboard to see live numbers. Single-sample numbers are not reported because TTFB variance from network jitter is too high to be meaningful.

---

## What's Measured

**TTFB (Time to First Byte):** Time from HTTP request sent to first audio byte received. This is the number that determines whether a voice agent feels responsive — a human expects audio within ~300ms of a question ending.

**Total generation time:** Time from request sent to last audio byte. Determines overall throughput and cost of parallelism.

Neither metric measures audio quality, pronunciation accuracy, or prosody — those require human evaluation. See Roadmap.

---

## The 3 Test Categories

### `hinglish_codeswitch` (7 utterances)
Indian users naturally mix Hindi and English mid-sentence. Failure modes: robotic intonation shift at the language boundary, wrong phonetics for Hindi words, over-anglicized pronunciation of embedded English phrases.

Examples: *"Sir aapka order kal evening tak deliver ho jaayega"*, *"Aapki KYC update ho chuki hai"*

### `indian_proper_nouns_and_codes` (6 utterances)
Indian financial infrastructure runs on IFSC codes (`HDFC0001234`), Aadhaar, PAN cards, and locality names that US-English TTS systematically mangles. Failure here in a fintech IVR is a compliance incident.

Examples: *"Please transfer to IFSC code HDFC0001234, beneficiary name Lakshmi Narayanan Iyer"*

### `credit_card_otp_readback` (7 utterances)
The highest-stakes TTS use case. Any digit error is a compliance failure. TTFB determines whether customers hang up before the OTP is read.

Examples: *"Your OTP is 8-4-7-2-3-9. Please do not share this with anyone."*

---

## Why This Exists

Indian voice AI is a 500M-user market. Every major bank, fintech, and e-commerce company runs a voice agent that speaks to customers in some combination of Hindi, English, and regional languages. Yet:

- No public TTS benchmark covers Hinglish or Indian financial data formats
- Providers optimize for English TTFB benchmarks that don't reflect Indian network conditions
- Quality evaluation is entirely manual and not reproducible

LATHE is a starting point. It only measures latency today. The full picture requires pronunciation scoring, prosody evaluation, and real-network jitter simulation — all on the roadmap.

---

## Reproduce in 4 Commands

```bash
# 1. Clone and install Python deps
git clone <your-repo> lathe && cd lathe
pip install -r runner/requirements.txt

# 2. Add API keys
cp .env.example .env
# Edit .env with your keys

# 3. Run the benchmark (writes audio + results.json)
python runner/main.py --runs 5
# Optional: filter providers/categories
#   python runner/main.py --runs 5 --providers smallest,sarvam --categories credit_card_otp_readback

# 4. Open the dashboard
cd dashboard && npm install && npm run dev
```

Dashboard at `http://localhost:5173`. Results in `dashboard/public/results.json`.

---

## Roadmap (cut from v0)

**v1 — Pronunciation scoring**
LLM-as-judge: feed audio transcript back through Whisper, diff against expected text, score digit accuracy for OTP/IFSC categories.

**v1 — Network jitter simulation**
Add `tc netem` latency injection to simulate Indian mobile network conditions (100–400ms RTT). Current numbers reflect local broadband to provider datacenter.

**v1 — More providers**
~~Sarvam AI~~ (added — built for Indian languages), Azure Neural TTS with `hi-IN` voices, Google Cloud TTS.

**v2 — STT round-trip**
Measure full voice agent loop: TTS → play → STT → back to text. Tests end-to-end fidelity, not just generation speed.

**v2 — Real-time streaming**
WebRTC-based TTFB measurement for providers that support chunked audio streaming.

---

## License

MIT
