# ElfMono — Audit & Compare (2026-10-29)

Three audits in one pass, all evidence-based: (A) every engine parameter probed for a real
audible effect, (B) web UI v2 compared line-by-line against the Figma design, (C) ElfMono
compared against the three reference monosynths from the brief. Findings ranked at the end.

## A. Parameter audit — 26/26 LIVE, 0 dead controls

Method (the house param-audit pattern): `cargo run --release --example audit_probe` renders,
for each parameter, a scenario built to expose it, at baseline and with the parameter changed,
and measures the RMS of the difference. Diff RMS > 0.005 = LIVE.

| ID | Probe | Diff RMS | Verdict |
|---|---|---|---|
| 0 | osc1_wave → triangle | 0.496 | LIVE |
| 1 | osc1_level → 0 | 0.359 | LIVE |
| 2 | osc2_wave → triangle | 0.326 | LIVE |
| 3 | osc2_detune → +600 ct | 0.315 | LIVE |
| 4 | osc2_level → 0 | 0.216 | LIVE |
| 5 | sub_level → 0 | 0.280 | LIVE |
| 6 | pulse_width → 0.25 (square ctx) | 0.574 | LIVE |
| 7 | cutoff → 200 Hz | 0.512 | LIVE |
| 8 | resonance → 0.9 (fc 1200 ctx) | 0.237 | LIVE |
| 9 | env_amount → 0 (fc 800 ctx) | 0.144 | LIVE |
| 10 | key_track → 1 (fc 400, A4) | 0.268 | LIVE |
| 11 | glide → 300 ms (phrase) | 0.557 | LIVE |
| 12 | legato → off (retrigger ctx) | 0.102 | LIVE |
| 13 | amp_attack → 800 ms | 0.248 | LIVE |
| 14 | amp_decay → 1000 ms (S 0.1) | 0.300 | LIVE |
| 15 | amp_sustain → 0.1 (D 100) | 0.371 | LIVE |
| 16 | amp_release → 2000 ms (tail) | 0.317 | LIVE |
| 17 | filt_attack → 600 ms (env ctx) | 0.313 | LIVE |
| 18 | filt_decay → 1200 ms (env, S 0.1) | 0.327 | LIVE |
| 19 | filt_sustain → 0.9 (env, D 100) | 0.304 | LIVE |
| 20 | filt_release → 2000 ms (env tail) | 0.014 | LIVE (weakest — see F3) |
| 21 | lfo_rate → 12 Hz (lfo→filt ctx) | 0.118 | LIVE |
| 22 | lfo_to_filter → 0.9 | 0.106 | LIVE |
| 23 | lfo_to_pitch → 0.9 | 0.608 | LIVE |
| 24 | drive → 1.0 | 0.161 | LIVE |
| 25 | volume → 0.2 | 0.380 | LIVE |

UI side of the same audit: the web panel has exactly 26 controls (23 knobs + 2 wave-chip
groups + legato switch) mapping 1:1 onto the 26 engine parameters. No fake controls,
no orphan parameters.

## B. UI fidelity: web v2 vs the Figma design

Matches (verified from both sources, not eyeballed):
- Panel 1320 wide, radius 18, all colour tokens identical to the Figma 0-1 values
  (orange #FF8B1A, section #201B14, LCD green #9EF26B, etc.).
- Knob model identical: 27 LED arc dots, lit 4.4px / unlit 3.2px, 7px amber pointer dot,
  label at face+8, value at face+24, Archivo SemiBold 10.5 labels, JetBrains Mono values.
- Knob sizes: oscillators 72, pulse 56, cutoff 118, filter row 68, strip 60, volume 72 — all match.
- LCD 400 wide, preset name 22px mono, readout 12px; gate LED present (and live in web).
- Layout order, wave chips, legato rocker + explainer, scope strip, 168px keyboard: match.

Drift / gaps:
- **F1 — Fonts are named but never loaded.** The web file sets `Archivo` and `JetBrains Mono`
  and loads neither (no @font-face, no font link — grep count 0). On any machine without those
  fonts installed, the panel falls back to system fonts and the Figma look quietly changes.
  This is the largest visual fidelity risk in the build.
- **F2 — ADSR knobs shrunk:** Figma 52px, web 44px (a fit decision when the envelope row
  was laid out). Values/arcs are right; the size is not the design.
- Minor: cutoff scale ring sits at R=94 in web vs R=86 in Figma; section heights are
  content-driven in web vs the fixed 452px in Figma; the Figma scope is a static saw drawing
  (350×104) where web runs a live scope (350×86) — web is better there, kept deliberately.
- Known one-sided gap: the Figma file itself still lacks the strip + keyboard nodes
  (Figma MCP limit, part-2 script saved), so for those two areas the web is ahead of the design file.

Interaction audit (from the web source):
- Knob drag uses pointer capture, Shift = fine, wheel steps 0.035, double-click resets. Good.
- **F4 — Knobs have no keyboard access or ARIA.** Not focusable, no arrow-key control, no labels
  for assistive tech. Synth Build's quality bar calls accessibility a release requirement.
- **F5 — Velocity is a dead end in the UI.** The engine takes velocity per note (and routes it
  to amp and filter), but every web input sends a fixed 0.9. Nothing a player does changes it.

## C. Compare: ElfMono vs the references

| Feature | ElfMono | Minimoog Model D | Roland SH-101 | Bass Station II |
|---|---|---|---|---|
| Oscillators | 2 + sub | 3 (+ osc3 as LFO) | 1 + sub | 2 + sub |
| Noise source | **none** | yes | yes | yes |
| Filter | TPT cascade ~24 dB/oct | 24 dB ladder | 24 dB (IR3109) | 24 dB classic + 18 dB acid |
| Envelopes | 2× ADSR | 2× ADS(D) | 1× ADSR (shared modes) | 2× ADSR |
| LFO | 1 (sine, to filt/pitch) | osc3 / noise as mod | 1 (tri/sqr/noise, to PWM etc.) | 2 |
| Glide / legato | glide + true legato + note stack | glide, legato-ish | glide (portamento modes) | glide + legato modes |
| Drive | yes, soft clip | ext-input feedback trick | no | distortion + filter drive |
| Sequencer / arp | none | none | sequencer + arp | arp + sequencer |
| Presets | 6 (browser only) | none (original) | none | 64 + AFX mode |
| PWM modulation | manual PW only | LFO to PW (mod mix) | LFO/env to PW | LFO/env to PW |

- **F6 — No noise source, and it's the one feature all three references share.** Noise is
  percussion, breath, filter-FM texture and half of classic mono sound design. ElfMono is the
  only synth in its own comparison table without it. Adding a noise source + mixer knob is
  small (one PRNG in the core) and closes the most defensible gap.
- Also absent vs references: LFO/env modulation of pulse width (101 and BS2 both have it;
  ElfMono's PW is static), a second LFO (BS2), any sequencer (101/BS2; the Minimoog famously
  has none either, so this one is defensible to skip).
- Where ElfMono honestly wins: dual full ADSRs beat the 101's shared envelope, the held-note
  stack with pitch fallback is better mono behaviour than any of the three, and it's the only
  one that is playable instantly in a browser with a measured 26/26-live parameter audit.

## Findings ranked

1. **F6 Noise source missing** — the reference-table gap. Musical, small, engine-side.
2. **F1 Fonts not loaded** — the design silently degrades on machines without Archivo/JetBrains Mono.
3. **F3 Filter release is masked by amp release** (probe 20, diff 0.014): with the default
   120 ms amp release, a 2 s filter release is nearly inaudible because the amp closes first.
   Not a bug — an interaction players will read as "this knob does nothing". Mitigations:
   link the two releases in presets, or document it on the panel.
4. **F5 Velocity unreachable from the UI** — fixed 0.9 everywhere; pointer-pressure or
   key-position velocity would wake up an existing engine path.
5. **F2 ADSR knob size drift** (52 → 44px) — restore by widening the envelope section layout.
6. **F4 No keyboard/ARIA on knobs** — release-bar item, not a prototype blocker.

Nothing in this audit touches the earlier verdicts: cargo tests 9/9 and the render proofs
stand, and the engine was not modified by the UI work.

---

## Follow-up (2026-10-30) — F6 CLOSED in code, pending Garth's ears

The F6 fix was implemented exactly as prescribed above (Wave 1 fan-out, project 2 of 5):

- **Engine:** a seeded xorshift32 white-noise generator (`NoiseGen`, fixed seed
  `NOISE_SEED = 0x2545_F491`) summed into the oscillator mixer pre-filter, so noise
  passes through the filter, both envelopes and drive. One new parameter only:
  ID 26 `noise_level`, 0..1, default 0. It advances once per rendered sample and
  every voice starts from the same seed, so noise renders are deterministic.
- **Presets / UI:** all pre-existing presets reach the engine with noise at the
  `DEFAULTS` value 0 — their sound cannot change (and measurably did not, below).
  One new preset, BREATH (noise 0.85), exists so the source can be heard alone.
  The web panel gained exactly one control — a NOISE LEVEL knob in the
  Oscillators section — for 27 controls = 27 engine parameters, preserving the
  1:1 discipline of §A.
- **Proof:** `cargo test` 13/13 (the 9 originals untouched and green, plus 4 noise
  tests: level-0 bit-identity + noise-only silence at 0, non-silence + broadband
  HF at 1, same-seed determinism, on/off liveness). `audit_probe` extended to 27
  probes, all LIVE; ID 26 `noise_level -> 0.8` diff RMS **0.1374** (threshold
  0.005). Render proof: original three patches reproduce the 2026-10-29 baseline
  measurements exactly (0.573/0.022, 0.365/0.078, 0.389/0.219); new twins at A2 —
  noise-off RMS 0.197, HF 0.096; noise-on (0.9) RMS 0.279, HF 0.331; on-vs-off
  diff RMS 0.215. Node/WASM check on the rebuilt single file: noise-only patch
  renders 0.000000 RMS at level 0, 0.3012 at 0.9, sample-identical across synths.
- **Status:** BUILT, NOT YET HEARD. F6 stays open in the only sense that matters
  here until Garth's listening gate — the code-side gap (the one feature all
  three references share) is closed.
- F1–F5 were not touched by this change.

---

## Follow-up (2026-10-30, second pass) — F1 + F3 CLOSED in code, pending Garth's gates

Two more findings fixed in one pass (Wave 1 fan-out follow-up). F5 (velocity)
was deliberately NOT touched — the UI still sends a fixed 0.9; that behaviour
change is a design pick reserved for Garth. F2 and F4 were not touched either.

### F1 — Fonts named but never loaded → FIXED (embedded, not linked)

- **Approach:** the deliverable is a single self-contained file, so the fonts
  are embedded as base64 `@font-face` rather than loaded from Google Fonts
  (a `<link>` would silently fall back to system fonts the moment the file is
  opened offline — the exact failure F1 describes, just moved). Sources:
  Fontsource variable builds, latin subset — Archivo (weights 100–900,
  34,928 B woff2) and JetBrains Mono (weights 100–800, 40,404 B woff2), both
  SIL OFL 1.1; binaries + licence texts live in `web/fonts/`, and
  `web/build_web.py` injects the `@font-face` rules into the template's
  `/*__FONTS__*/` slot at build time. The template's existing stacks
  (`Archivo`, `'JetBrains Mono'`) now resolve to the real faces.
- **Size cost:** the playable file grows 121,562 B → **222,795 B (+101,233 B)**,
  essentially the base64 of 75,332 B of font binary. Still a single file,
  still offline-proof.
- **Verification:** both embedded payloads decode byte-identical to the source
  woff2 files (`wOF2` magic confirmed); zero external font requests in the
  built page; both page scripts parse in Node; the WASM build instantiates
  and renders (see F3 numbers below).

### F3 — Filter release masked by amp release → FIXED (gate hold, DR-003)

- **Root cause, precisely:** the two ADSRs are fully independent and linear.
  `note_off` starts both releases in the same sample; the amp envelope's
  release rate takes it to zero in `amp_r` ms (120 ms default), at which point
  `process_sample` treats the voice as idle and returns silence. The filter
  envelope is still mid-release — with `filt_r` = 2000 ms, 1,880 of its
  2,000 ms ran under a VCA already at zero. The knob wasn't dead (probe 20
  measured 0.0142, not 0); it was masked by construction.
- **Fix (DECISIONS.md DR-003):** when `filt_r > amp_r`, note-off records the
  owed difference as a gate hold; once the amp envelope finishes, the voice
  keeps rendering with the amp gain fading linearly from its release-start
  level to zero over exactly the owed remainder, so the filter release
  completes audibly and silence arrives when the filter envelope ends.
  Patches with `filt_r ≤ amp_r` take no hold and render bit-identically.
- **Before → after (same scripts, measured both sides of the change):**
  - audit probe 20 (`filt_release -> 2000 ms`, default amp): diff RMS
    **0.0142 → 0.2888** — now in line with the other envelope probes.
  - `render_proof` gained a permanent F3 section (probe-20 patch, tail
    window 0.5–2.0 s after note-off): long release (2000 ms) window RMS
    **0.0000 → 0.2365**; short release (160 ms) window RMS 0.0000 on both
    sides; long-vs-short diff RMS over the script **0.0091 → 0.2285**.
    Proof WAV: `tests_render/filt_release_tail_A1.wav`.
  - `cargo test` **15/15** — the 13 pre-existing tests untouched and green,
    plus `filter_release_outlives_amp_release` (audible window + eventual
    silence) and `short_releases_not_extended` (defaults and filt_r < amp_r
    tails still die on schedule).
  - Node/WASM on the rebuilt single file: held A1 at engine defaults renders
    RMS 0.4768; the default release tail reaches exactly 0.000000; the F3
    scenario through the WASM build measures window RMS **0.2365**, matching
    the native render exactly.
- **Baseline guard:** deep_bass_C2 RMS **0.5734** and acid_A1 **0.3647**
  reproduce exactly, as do both noise twins (0.1973 / 0.2794, diff 0.2148).
  glide_lead_phrase moved **0.3889 → 0.3908 (+0.0019)**: it is the only
  baseline whose render includes note-offs at the default releases
  (160 vs 120 ms), so its final tail now carries the 40 ms owed hold — the
  fix operating as designed, peak (0.7038) and HF ratio (0.219) unchanged,
  held-note audio untouched.

- **Status:** BUILT, NOT YET HEARD and NOT YET SEEN in a real browser. The
  font fix is payload-verified headlessly but its visual gate is Garth
  opening the page; the filter-release fix is measurement-verified but its
  listening gate is still his. F1 and F3 stay open in that sense only.

---

## Follow-up (2026-10-30, third pass) — F5 + F4 CLOSED in code, pending Garth's gates

Both remaining UI findings fixed in one pass, web UI only — the engine was
not touched (`cargo test` still 15/15, native code byte-identical in
behaviour; the WASM package was rebuilt only because `build_web.py` always
rebuilds it). With this pass every audit finding except F2 (ADSR knob size,
a layout call) is closed in code.

### F5 — Velocity unreachable from the UI → FIXED (position velocity)

- **Behaviour (Garth's pick, 2026-10-30):** where on a key you strike sets
  the velocity — higher on the key = harder hit. Mapping, linear over the
  key element's own bounding box: `velocity = 0.35 + (1 − yFrac) × 0.65`,
  where `yFrac = (clientY − rect.top) / rect.height` clamped 0..1. So the
  very top of a key = **1.00**, middle = **0.675**, bottom edge = **0.35**
  (the floor keeps soft strikes clearly audible rather than whispering).
  Each key uses its own rect, so black keys (62% height) map over their
  own surface.
- **Paths:** `pointerdown` on a key sends `posVel(event, key)`; glissando
  `pointerenter` sends the *entered* key's position velocity from the
  entry event — a drag that lands high on the next key hits it hard, low
  hits it soft. Computer-keyboard input has no position and keeps the
  previous fixed **0.9**. The engine already routed velocity to amp and
  filter; no engine change was needed or made.
- **Verification (headless, the built page's own script run in Node
  against a stub DOM with a recording synth stub):** synthetic pointer
  strikes on C4 at top / middle / bottom / quarter height delivered
  velocities **1.0 / 0.675 / 0.35 / 0.8375** to `note_on`, in order;
  a gliss C4→D4 entered low-then-mid delivered **[0.35, 0.675]** — each
  note took its own entry position; a synthetic `KeyA` keydown delivered
  exactly **0.9**.

### F4 — No keyboard access or ARIA on knobs → FIXED

- **What every knob face now is:** focusable (`tabindex=0`, orange focus
  ring in the panel's design language), `role="slider"`, `aria-label` =
  the parameter name, `aria-valuemin` / `aria-valuemax` = the parameter's
  real range endpoints, and `aria-valuenow` / `aria-valuetext` updated on
  every change from the same `refresh()` funnel that redraws the LED ring
  and the printed value — so pointer drags, wheel, presets, keyboard and
  assistive tech can never disagree. `aria-valuetext` carries the real
  musical value in the panel's own formatting (`900 Hz`, `1.66 kHz`,
  `81%`, `+7 ct`), identical to the value printed under the knob.
- **Keys:** ArrowUp/Right and ArrowDown/Left = fine step (1% of knob
  travel), PageUp/PageDown = coarse step (10%), Home = min, End = max.
  Steps are in normalized space, so log-scale parameters (cutoff, times,
  LFO rate) move multiplicatively — an arrow press on Cutoff is a small
  ratio change anywhere on the dial. All key handling routes through the
  same `setParam` + `refresh` path as pointer drags, so the LCD readout
  updates exactly as it does for a drag.
- **Count note:** the panel has **24 rotary knobs**; the 27 engine
  parameters are 24 knobs + 2 wave-selector chip groups + the legato
  rocker (the chips and rocker are native `<button>`/clickable controls
  that were already keyboard-reachable). All 24 knobs carry the full
  ARIA set.
- **Verification (same headless harness):** all 24 knob faces report
  role/tabindex/label/min/max/now/text present, zero missing; the
  Cutoff knob driven purely by synthetic key events tracked in lockstep —
  start 900 Hz → ArrowUp **957 Hz** → ArrowDown back to **900 Hz** →
  PageUp **1.66 kHz** → Home **40 Hz** → End **18.0 kHz** → ArrowLeft
  **16.93 kHz**, with `aria-valuenow` matching the engine value,
  `aria-valuetext` matching the printed label, and the LCD readout
  following at every step; Volume ArrowRight moved 80% → **81%**; after
  all driving, every knob's `aria-valuetext` still equals its printed
  value (zero mismatches).
- **Rebuild + sanity:** playable file rebuilt only via `web/build_web.py`
  → **225,097 B** on disk (+2,302 B over the F1/F3 build). Both page
  scripts parse in Node; real-WASM check on the rebuilt package: held
  A1 at engine defaults renders RMS **0.4948** / peak 0.7064, and the
  release tail reaches exactly **0.000000** RMS.
- **Status:** BUILT, NOT YET HEARD and NOT YET BROWSER-TESTED. Position
  velocity's *feel* (is 0.35 the right floor? is linear right?) and the
  keyboard flow's real-browser behaviour are Garth's gates, same as
  everything else on this panel. F4's remaining release-bar half — a
  screen-reader pass in a real browser — is likewise still owed.
