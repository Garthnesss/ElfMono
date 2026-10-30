# Technology Evaluation — ElfMono

> Synth Build Rule 1: no inherited stack. Date: 2026-10-29. Evaluator: Muse. Decision record: DR-001 in DECISIONS.md.
> REA-Results check (standing rule): local mirror searched 2026-10-29 (snapshot 2026-10-25, commit 315e420, INDEX.md read, grep for monosynth/synth) — no matching prior work; the 13 targets are SDR/game subjects. Noted and continued.

## 1. Project requirements (from the Project Brief)
- Platforms/formats: Web playable prototype v1; desktop plugin (VST3/AU/CLAP) later, not committed.
- Synthesis & polyphony: subtractive mono, 1 voice, PolyBLEP oscillators, modulated resonant filter.
- Performance budget: trivially low for one voice; correctness and stability matter more than raw CPU.
- UI ambitions: single panel, clickable keyboard, knobs/sliders with musical values, oscilloscope. No editor screens in v1.
- Team skills & AI-agent involvement: Muse writes and tests all code; Rust and C++ both have a track record in this workspace, JS likewise. Fast compile/test loop on the VM is a real criterion.
- Business / licensing: no paid licenses for v1; permissive preferred.
- Maintenance horizon: unknown; core must survive shell changes (exit cost weighted heavily).

## 2. Weighted criteria (weights fixed before scoring)
| Criterion | Weight | What "good" means here |
|---|---|---|
| Sound quality / DSP capability | 3 | PolyBLEP, stable modulated filter, oversampling headroom if needed |
| CPU efficiency | 2 | One voice, so any sane stack passes; still scored |
| Latency | 2 | Low in the browser path; core itself adds none |
| Polyphony & modulation headroom | 1 | Mono: headroom is a non-issue |
| Plugin compatibility (later) | 2 | A credible route to VST3/AU/CLAP without rewriting DSP |
| Standalone / mobile / web reach | 3 | Browser-playable v1 is the owner's proven way to hear things |
| UI capability | 1 | One panel; every candidate passes |
| Development complexity | 3 | Time to first *verified* sound on this VM |
| Build & deployment | 2 | Single-file HTML deliverable; cargo/CI simplicity |
| Licensing | 3 | No paid license, no GPL obligation on the core |
| Community & ecosystem | 1 | Examples and longevity |
| Long-term maintenance | 2 | Small dependency surface |
| Portability / exit cost | 3 | DSP core independent of any shell/framework |
| AI coding-agent compatibility | 3 | Strong training-data depth, fast test feedback |

## 3. Candidates
### Candidate A — Rust core + WASM web shell (NIH-plug shell later, if wanted)
- Framework-independent Rust DSP crate (`#![forbid(unsafe_code)]` outside the WASM binding), wasm-bindgen web shell now; NIH-plug (Rust, ISC) is the evaluated later route to VST3/CLAP.
### Candidate B — C++ / JUCE
- Industry default. One codebase to VST3/AU/standalone; huge ecosystem. JUCE is GPLv3 or a paid commercial license.
### Candidate C — TypeScript / Web Audio + AudioWorklet only
- Fastest browser demo, zero build chain. DSP lives in the worklet and dies there: no plugin route, core is throwaway by construction.
- Long list discarded early: Faust (strong DSP compiler, but an extra language/toolchain for one mono voice and weaker agent fluency here), iPlug2/DISTRHO (credible C++ alternatives to JUCE with less ecosystem depth for this team), raw VST3 SDK (maximum labour for a later phase, not v1).

## 4. Comparison matrix (1-5, evidence noted)
| Criterion (weight) | A: Rust+WASM | B: C++/JUCE | C: TS/WebAudio |
|---|---|---|---|
| Sound / DSP (3) | 5 — PolyBLEP + TPT implemented and render-tested in-crate | 5 — same algorithms available | 3 — worklet DSP possible, band-limiting is hand-rolled per node graph limits |
| CPU (2) | 5 | 5 | 4 |
| Latency (2) | 3 — browser path dependent | 5 (native) / n/a web | 3 |
| Poly/mod headroom (1) | 5 | 5 | 4 |
| Plugin compat later (2) | 3 — NIH-plug route exists, thinner host coverage evidence | 5 — best in class | 1 — none |
| Web reach (3) | 5 — WASM single-file proven in this workspace (ElfSynth One, Oct 9 2026) | 2 — no practical web target | 5 |
| UI (1) | 4 | 5 | 4 |
| Dev complexity (3) | 4 — cargo test loop is seconds; prior WASM inlining lessons documented | 2 — VM GUI/X11 friction already hit on ElfPro800; Mac needed to validate AU/VST | 5 — instant |
| Build & deploy (2) | 4 | 3 | 5 |
| Licensing (3) | 5 — Rust/MIT-Apache ecosystem, NIH-plug ISC | 2 — GPLv3 or paid | 5 |
| Community (1) | 3 | 5 | 4 |
| Maintenance (2) | 4 | 4 | 3 |
| Portability / exit (3) | 5 — core has no shell dependencies | 3 — JUCE DSP ties are avoidable but tempting | 1 — core is the shell |
| AI-agent compat (3) | 4 — strong Rust fluency, deterministic tests | 4 | 4 |
| **Weighted total** | **131** | **110** | **96** |

## 5. Advantages & disadvantages
### A
+ Core verified offline by cargo tests before any UI exists; web proof today, plugin shell later without a DSP rewrite; permissive licensing.
− Plugin route (NIH-plug) has less host-validation history than JUCE; browser audio path in the prototype is a stopgap.
### B
+ Best plugin/host story and UI framework; the safe commercial default.
− Slowest to a *heard* result in this owner's actual workflow, license cost/GPL fork in the road, and v1 is web, where it scores worst.
### C
+ Zero toolchain, instant demo.
− Violates the project's core hedge: everything learned about the sound is locked in a browser worklet.

## 6. Licensing considerations
| Component | License | Checked | Compatible? |
|---|---|---|---|
| Rust std / cargo crates used (wasm-bindgen) | MIT / Apache-2.0 | 2026-10-29, crate metadata | Yes |
| NIH-plug (later, if used) | ISC | From Synth Build TECHNOLOGY_SELECTION notes, recheck at adoption time | Yes |
| JUCE (rejected for v1) | GPLv3 or paid commercial | Synth Build reference summary, 2026-10-29 | Only with cost or GPL; a reason B lost |
| VST3 SDK (later) | GPLv3 or Steinberg proprietary agreement | Recheck at plugin phase | Gate for the plugin phase, not v1 |

## 7. Performance considerations
- Benchmarks run: the crate's offline render tests double as the v1 perf sanity check (44.1 kHz mono renders, timed by the test harness wall clock; a voice this size is not CPU-bound in any candidate).
- Benchmarks still needed: browser CPU on Garth's machine (his listening session), NIH-plug host matrix (plugin phase).

## 8. Proof-of-concept requirements
| PoC | Question | Time box | Result |
|---|---|---|---|
| Core voice render suite | Does the Rust voice hit pitch/filter/legato/glide measurements? | This session | See TEST_PLAN.md / STATUS.md |
| WASM single-file page | Does the workspace's known WASM inlining route still work end to end? | This session | See STATUS.md |
| Minimal plugin in 2 hosts | Framework/host fit? | Plugin phase only | Not started, by design |

## 9. Recommendation
- **Stack:** Rust DSP core (no framework, no shell dependencies) / WASM + plain HTML/JS web shell for v1 / Cargo build / NIH-plug evaluated again at the plugin phase.
- **Why it wins:** the weighted criteria this project actually has: web-first proof, exit cost, licensing, dev loop speed.

## 10. Why alternatives were rejected
- B (JUCE): wins plugin compatibility, loses the v1 that exists (web), on licensing and on time-to-verified-sound here.
- C (WebAudio only): wins speed, loses the instrument: no portable core.

## 11. Conditions that would change this recommendation
- DAW plugin becomes the v1 priority (re-run this evaluation; JUCE or NIH-plug shell moves to now, core stays).
- iPad AUv3 becomes v1 (add a Swift shell + C ABI candidate).
- Rust/WASM route fails its PoC in Garth's browser (fall back to C for the demo only, core design unchanged).
