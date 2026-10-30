# ElfMono — Test Plan (v1)

Automated (cargo test, offline renders at 44,100 Hz):
1. **Idle silence** — no notes: 1 s render is exactly 0.0 everywhere.
2. **No NaN / bounded** — worst-case patch (all sources, drive 1, resonance 0.95, env full) over pitch/mod sweeps: all samples finite, peak <= 1.0.
3. **Pitch accuracy** — saw only, filter open, A4: upward zero-crossing rate within 435-445 Hz over the steady second.
4. **Filter darkening** — saw at C3, cutoff 300 Hz vs 12,000 Hz: high-frequency proxy (mean absolute sample difference) at low cutoff is less than half the open value.
5. **Legato** — hold C, legato to G with legato on: amp envelope level never returns to attack (stays >= 90% of its pre-change level across the change window).
6. **Glide** — 300 ms glide, C4 to C5: internal smoothed pitch starts near C4, passes the midpoint, and lands within 5 cents of C5 by 300 ms.
7. **Release** — note off after sustain: RMS in the final 100 ms of a 1 s tail is < -60 dBFS.
8. **Determinism** — the same note/parameter script rendered twice is bitwise identical.
9. **Note stack** — hold C, hold E, release E: pitch returns to C (last-note priority), still gated.

Listening (Garth, Phase 2 gate): Deep Bass preset for low-end weight, Acid for resonance/env character, Glide Lead for legato feel, Sub preset for the sub oscillator. What to listen for is written on the delivery message; results go in STATUS.md verbatim.

Not in v1: host tests, hardware tests, CPU benchmarking beyond the render-suite wall clock (mono voice, see brief).
