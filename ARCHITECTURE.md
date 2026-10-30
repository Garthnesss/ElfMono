# ElfMono — Architecture

## Components
- `src/lib.rs` — the whole DSP core, one crate, no shell dependencies.
  - `MonoSynth` — owns one `Voice`, a parameter set, and stereo output buffers' source (mono signal duplicated).
  - `Voice` — note stack (last-note priority, max 16 held), current pitch in log domain with glide smoothing, oscillators, filter, envelopes, LFO.
  - Oscillators — PolyBLEP saw and pulse (PWM), plain triangle (low aliasing at mono bass/lead pitches, documented), square sub at -12 semitones.
  - Filter — two cascaded TPT/Zavalishin SVF lowpass sections (g = tan(pi*fc/sr)), ~24 dB/oct, resonance mapped to k, cutoff modulated per-sample by envelope, LFO, key tracking and velocity, clamped to 20 Hz..0.45*sr.
  - Envelopes — two ADSRs (amp, filter), linear segments, retrigger from current level; legato note changes do not retrigger either.
  - LFO — sine/triangle, to cutoff (in octaves) and pitch (in semitones, depth-scaled).
  - Drive — tanh soft clip after the filter, gain compensated.
- `src/wasm_api.rs` (feature `wasm`, wasm32 only) — wasm-bindgen wrapper: `note_on`, `note_off`, `set_param(id, value)`, `render_block(len)` + `left_ptr`/`right_ptr`, and `render_js(len)` returning a Float32Array, which is what the web UI's audio callback uses (the allocation lives in this binding layer, not the core).
- `web/` + build script — wasm-bindgen `--target no-modules` output inlined (base64) into a single HTML file with the panel, keyboard and preset code. Classic script tag, per the documented WASM lesson for this workspace.

## Data flow
UI / keyboard events (JS) -> `note_on/off`, `set_param` -> core state (plain values, no locks) -> `render_block` fills internal buffers per sample: pitch glide -> oscillators + noise -> mixer -> filter (modulated) -> amp env -> drive -> out. JS copies from WASM memory pointers into the audio callback.

## Threading / real-time rules
- Render path: no allocation (fixed arrays, pre-sized buffers), no locks, no I/O, no logging.
- Parameter changes are direct value writes between blocks, smoothed inside the DSP (cutoff/resonance smoothed per sample via the modulation path; glide smooths pitch).

## Parameter registry (v1, IDs are stable)
| ID | Name | Range (musical) | Default |
|---|---|---|---|
| 0 | osc1_wave | 0 saw, 1 square, 2 triangle | 0 |
| 1 | osc1_level | 0..1 | 0.8 |
| 2 | osc2_wave | 0 saw, 1 square, 2 triangle | 0 |
| 3 | osc2_detune | -1200..+1200 cents | +7 |
| 4 | osc2_level | 0..1 | 0.5 |
| 5 | sub_level | 0..1 | 0.4 |
| 6 | pulse_width | 0.05..0.95 | 0.5 |
| 7 | cutoff | 40..18000 Hz (log in UI) | 3200 |
| 8 | resonance | 0..1 | 0.25 |
| 9 | env_amount | -1..+1 (to cutoff, octaves scaled x4) | 0.45 |
| 10 | key_track | 0..1 | 0.3 |
| 11 | glide_ms | 0..500 ms | 60 |
| 12 | legato | 0 off, 1 on | 1 |
| 13-16 | amp ADSR | A 0..2000 ms, D 0..2000 ms, S 0..1, R 0..5000 ms | 3 / 180 / 0.8 / 120 |
| 17-20 | filter ADSR | same ranges | 2 / 220 / 0.25 / 160 |
| 21 | lfo_rate | 0.05..30 Hz | 5 |
| 22 | lfo_to_filter | 0..1 (octaves x2) | 0 |
| 23 | lfo_to_pitch | 0..1 (semitones x1) | 0 |
| 24 | drive | 0..1 | 0.15 |
| 25 | volume | 0..1 | 0.8 |
| 26 | noise_level | 0..1 | 0 |

Noise source: a seeded xorshift32 white-noise generator (`NoiseGen`, seed
`NOISE_SEED`) summed into the oscillator mixer pre-filter, so it passes through
the filter, envelopes and drive like the oscillators. It advances once per
rendered sample and every voice starts from the same seed, so renders are
deterministic; at level 0 its mixer term is exactly 0.0 and pre-noise patches
render bit-identically (added 2026-10-30, closing AUDIT finding F6).

State format: none in v1 (browser presets are JS objects calling set_param). Plugin phase must version a state format from day one of that phase.

## Dependencies (code references)
- Rust std only for the core. wasm-bindgen only under the `wasm` feature on wasm32.
- Nothing in the core references JUCE, NIH-plug, or any host API; shells adapt to the core, never the reverse.
