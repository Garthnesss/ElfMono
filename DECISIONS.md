# ElfMono — Decision Records

## DR-001 — Stack: Rust core + WASM web shell for v1
- **Date:** 2026-10-29. **Decider:** Muse under Garth's Synth Build go-ahead; reversible by Garth.
- **Context:** v1 must be heard in a browser fast (the owner's working pattern), with a core that survives a later plugin shell. Full scoring in TECHNOLOGY_EVALUATION.md.
- **Options:** A Rust+WASM (131), B C++/JUCE (110), C TypeScript/WebAudio only (96).
- **Decision:** A.
- **Consequences:** plugin phase re-opens the shell question only; core, tests and presets carry over. Browser prototype audio path is a known stopgap.
- **Revisit conditions:** plugin becomes the priority, iPad becomes v1, or the WASM PoC fails in Garth's browser.


## DR-002 — Filter: TPT/Zavalishin SVF cascade, Chamberlin banned
- **Date:** 2026-10-29.
- **Context:** workspace lesson (Sep 29, 2026): naive Chamberlin SVF goes unstable when its f coefficient passes 1 under envelope-modulated cutoff and explodes to NaN silently. Synth Build DSP reference names the same failure and defaults to TPT.
- **Decision:** two cascaded TPT SVF lowpass sections for ~24 dB/oct; no Chamberlin code anywhere in the crate.
- **Revisit:** a measured ladder model (oversampled, nonlinear) is a Phase 3 candidate if Garth wants more Moog character; it replaces the sections behind the same interface.

## DR-003 — Filter release masking (AUDIT F3): gate hold, not coupled releases
- **Date:** 2026-10-30.
- **Context:** AUDIT F3 — with independent ADSRs and the default 120 ms amp release, a 2 s filter release was nearly inaudible (probe 20 diff RMS 0.0142): note-off starts both releases together, the amp envelope reaches zero first, and the remaining filter decay runs under a closed VCA.
- **Justification:** On the Minimoog the filter contour is heard *through* the amplifier contour, and on the SH-101 a single shared envelope makes the question moot — in both cases the filter envelope is audible for exactly as long as the gate is open. ElfMono's two independent ADSRs are a deliberate win over the 101's shared envelope, but independence creates this masking trap. Coupling the knobs (forcing amp release to track filter release) would change what AMP RELEASE means; shortening the filter release would change what FILT RELEASE means. Instead the voice owes the difference as gate time: when filt_r > amp_r, note-off starts a hold of (filt_r − amp_r) during which the amp gain fades linearly from its release-start level to zero, reaching silence exactly when the filter release ends. Both knobs keep their exact meanings, each envelope still completes on its own schedule, and any patch with filt_r ≤ amp_r renders bit-identically to before — the VCA simply stays open long enough for the filter contour to be heard through it, which is what a player turning up FILT RELEASE is asking for.
- **Consequences:** probe 20 diff RMS 0.0142 → 0.2888; render_proof gained a permanent F3 section (+ `tests_render/filt_release_tail_A1.wav`). One baseline moved by design: glide_lead_phrase RMS 0.3889 → 0.3908 (+0.0019) — it is the only baseline whose render includes note-offs at defaults (160 vs 120 ms = a 40 ms owed hold in its final tail); peak and HF ratio unchanged, held-note audio untouched. Deep-bass, acid and noise-twin baselines reproduce exactly. cargo test 15/15 (2 new F3 tests).
- **Revisit:** if Garth's listening gate says the held tail sounds wrong (e.g. wants an exponential rather than linear hold fade, or prefers explicit release coupling), the change is local to `note_off`/`process_sample`.
