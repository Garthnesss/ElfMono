# ElfMono A/B compare — reconstruction notes (2026-10-30)

Deliverable: `~/workspace/your_files/elfmono-ab.html` (329,218 B) — one
self-contained page holding BOTH engines, built by `build_ab.py` from
`template_ab.html` (derived from the live `web/template.html`).

## What side A actually is

No pristine pre-Wave-1 WASM or engine source survived (the Oct 29 playable
was overwritten in place by each rebuild). The faithful route was
reconstruction from the dated source backups the Wave-1 agents left:

- Start: `src/lib.rs.bak-20261030` — the engine exactly as the fonts+F3
  agent found it. A diff against the live `src/lib.rs` is *only* the
  DR-003 gate-hold change, so the backup is provably post-noise /
  pre-gate-hold.
- Revert the noise change in the copy (scripted, single-occurrence
  assertions per edit): removed `P_NOISE_LEVEL`/`NOISE_SEED`,
  `Params.noise_level`, `NoiseGen`, the voice field/init, the set_param
  arm, the mixer term, and the 4 noise tests (+1 line in the no-NaN test).
  Zero "noise" mentions remain in `ab/old/src/lib.rs`.
- Gate-hold needed no revert in the copy: it was never in the backup.

Result: `ab/old/` — a 26-param engine with the Oct 29 test suite (9 tests).

The earliest surviving *template* backup (`web/template.html.bak-20261030`)
is already post-noise, so the A/B page uses one shared UI (the current
panel — same layout the Oct 29 build shipped) with side-faithful behavior:
on A the noise knob is disabled, BREATH is B-only, and pointer velocity is
the fixed 0.9 the old UI sent. The old page's font failure (AUDIT F1) is
deliberately not reproduced; the legend on the page says so.

## Verification (identical probe code, native, both copies)

`examples/ab_probe.rs` in each copy; outputs in `probe_old.txt` /
`probe_new.txt`:

| probe | OLD (ab/old) | NEW (ab/new) | documented |
|---|---|---|---|
| cargo test | 9/9 | 15/15 | 9 (Oct 29) / 15 |
| deep_bass_C2 RMS / HF | 0.5734 / 0.022 | 0.5734 / 0.022 | 0.5734 / 0.022 |
| acid_A1 RMS / HF | 0.3647 / 0.078 | 0.3647 / 0.078 | 0.3647 / 0.078 |
| glide_lead RMS / HF | 0.3889 / 0.219 | 0.3908 / 0.219 | 0.3889 → 0.3908 |
| F3 tail window (2 s filt release) | **0.0000** | **0.2365** | 0.0000 → 0.2365 |
| F3 long-vs-short diff | 0.0091 | 0.2285 | 0.0091 → 0.2285 |
| param-26 noise-only RMS | **0.0000** | 0.3360 | silence → noise |

## Verification (the shipped page itself, headless)

`verify_ab.js` — all 3 script blocks parse; both embedded glues
instantiate side-by-side in one context (the single `wasm_bindgen` token
per glue is renamed `wasm_bindgen_a` / `wasm_bindgen_b`); through the
*embedded* WASMs: held default RMS 0.5055 on both sides (bit-identical —
matched output level), F3 window A = 0 exactly / B = 0.2365, noise probe
A = 0 exactly / B = 0.3360. All checks PASS.

`verify_ui_stub.js` — the page's main script runs against a stub DOM:
boots on A, setSide flips both ways, BREATH applies on B and falls back
to INIT when flipped to A, noise knob disabled only on A. All PASS.

Still owed: Garth's listening session — BUILT, NOT YET HEARD.
