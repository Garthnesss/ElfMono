# Project Brief — ElfMono

> Synth Build v0.3.0 template, filled 2026-10-29. Unknowns are marked, not hidden.
> Interview note: Garth's instruction was a terse go-ahead ("make me a monosynth"), so
> defaults below are Muse's documented assumptions, each flagged, for him to correct.
> That compresses Phase 1; the compression is recorded in STATUS.md.

## 1. Identity
- **Name (working title):** ElfMono
- **One-sentence concept:** A punchy, playable analog-style monosynth for bass and lead that you can hear in a browser in under a minute.
- **Musical identity:** 1970s-80s analog mono: fat detuned saws, square sub under everything, resonant filter sweeps, snappy envelopes, glide leads. Genres: electronic, funk, synthwave, Berlin-school, hip-hop bass.
- **Reference instruments:** Moog Minimoog Model D (3-osc fatness, glide, filter character), Roland SH-101 (one osc + sub simplicity, immediacy), Novation Bass Station II (modern mono done right, drive), Moog Subsequent 25 (contemporary bass weight).
- **Differentiator:** Instant, no-install browser playability on a DSP core that is not throwaway: the same Rust core is the future plugin's engine.

## 2. Users
- **Primary users:** Garth first; then producers/performers who like mono bass/lead.
- **Their workflow:** sketching in the browser, later in a DAW (Ableton Live is Garth's).
- **Skill level assumed:** knows what cutoff, resonance, glide and ADSR do; no patience for menu diving.
- **What they complain about in current tools:** *Assumption to validate, not sourced research:* slow time-to-first-sound, tiny plugin windows, mono synths with weak sub/low end, legato that retriggers wrong.

## 3. Product shape
- **Synthesis method(s):** subtractive, PolyBLEP oscillators.
- **Polyphony target:** 1 | **Voices / unison:** 1 voice, detuned osc 2 instead of unison.
- **Modulation ambitions:** filter envelope, LFO to filter and pitch, velocity to filter (fixed routing in v1; no mod matrix in v1).
- **Effects included:** drive (soft clip) in v1. Delay is roadmap.
- **Presets/content at launch:** 5 browser presets in the prototype (Init, Deep Bass, Acid, Glide Lead, Sub). No file format in v1.
- **Standout features (max 3 for v1):** 1) true legato + held-note stack, 2) sub oscillator, 3) filter envelope character at high resonance.

## 4. Platforms & formats
| Platform | Format(s) | v1 / Later / Never |
|---|---|---|
| Web | WASM, single-file HTML | v1 |
| macOS | VST3 / AU / CLAP / standalone | Later, Garth's call |
| Windows | VST3 / CLAP / standalone | Later |
| iPadOS / iOS | AUv3 + app | Later / unknown |
| Embedded | none | Never (v1 scope) |

## 5. Business & constraints
- **Model:** open / personal project, no price set. *Unknown: whether ElfMono ever ships publicly.*
- **Licensing constraints:** permissive stack chosen (see TECHNOLOGY_EVALUATION.md); no GPL engine reuse.
- **Timeline & milestones that are fixed:** none given.
- **Team:** Garth (owner, listening sign-off), Muse (design, code, tests).
- **Budget realities:** no paid framework licenses for v1.

## 6. Performance expectations
- **Reference machine/device:** any modern laptop browser; DSP core budget measured on this VM's offline renders.
- **Worst-case patch definition:** both oscillators + sub on, filter modulated, drive on, at 44.1 kHz. Monophony makes CPU risk low by construction.
- **CPU / latency / memory targets:** one voice must be a small fraction of one core; browser prototype latency is whatever the prototype audio path gives (labelled a limitation, see STATUS.md).

## 7. Risks & unknowns
| Risk / unknown | Impact | How Phase 4 prototyping will test it |
|---|---|---|
| Browser audio path (ScriptProcessor) latency/jitter | Playability feel | Prototype uses it knowingly; AudioWorklet is the recorded fix if feel is poor |
| Filter character disappoints by ear | The whole instrument | Offline centroid measurements + Garth listening gate before any plugin work |
| Garth actually wanted a different mono flavour (e.g. acid-only, or West-coast) | Direction | Brief assumptions flagged; his correction re-aims v1.1 cheaply at this size |

## 8. Out of scope (v1)
- Polyphony, unison stacks, mod matrix, sequencer/arpeggiator, wavetables, FM, sample playback, preset files, plugin formats, MIDI hardware requirement.

## 9. Success criteria
- Technically: offline render tests pass (pitch, filter, legato, glide, release, determinism, no NaN).
- Musically: Garth plays the browser build and calls the bass and the glide good.
- Process: a new assistant could continue this project from these docs alone.
