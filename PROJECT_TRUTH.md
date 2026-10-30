# ElfMono — Project Truth

## One line
ElfMono is a software monosynth in the Minimoog / SH-101 lineage: 2 oscillators + sub, glide and true legato, a resonant lowpass filter with its own envelope, built first as a playable browser prototype on a portable Rust DSP core.

## What it is
- Monophonic only, by design: last-note priority with a held-note stack, legato playing does not retrigger envelopes, pitch glides at a set time.
- Analog-modelled signal path: PolyBLEP oscillators, TPT/Zavalishin filter (2 cascaded sections, ~24 dB/oct), two ADSR envelopes, one LFO, soft-clip drive.
- A real project run under Synth Build v0.3.0: brief and technology evaluation were written before code, no stack was inherited by default (see TECHNOLOGY_EVALUATION.md).
- Playable without MIDI hardware: clickable on-screen keyboard plus computer keyboard, per Garth's established preference.

## What it is not
- Not a polysynth, not a preset workstation, not a clone of one specific hardware unit's measured circuit.
- Not (yet) a DAW plugin. VST3/AU/CLAP is a later shell around the same core, gated on Garth's call.
- Not a hardware or firmware project.

## Non-negotiables
1. **Real-time safety.** No allocation, locking, or I/O in the render path; parameters are plain values smoothed in the DSP.
2. **Filter stability.** TPT filter only. The naive Chamberlin SVF is banned in this codebase (it goes unstable under modulated cutoff, a lesson already paid for on an earlier project).
3. **Musical proof with automated proof.** Every audible claim needs an offline render measurement and a listening check by Garth before it is called done.
4. **Honest status.** BUILT NOT TESTED is not RUNS. STATUS.md states the evidence level for every piece.

## Confirmed by Garth
- 2026-10-29: "Use Synth build to make me a monosynth" — project start, Synth Build process, monosynth scope.

## Scope boundaries
- v1 (this build): Rust core, offline render tests, WASM browser prototype with the control set in ARCHITECTURE.md.
- Out of v1: DAW plugin shells, iPad AUv3, preset file format / DAW state, MPE, sequencer/arpeggiator, effects beyond drive (delay/reverb are roadmap, not v1).
- What brings a later item into scope: Garth naming it, then a roadmap update.
