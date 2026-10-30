# ElfMono — Roadmap

Phases are gated on verification, not dates.

## Phase 0 — Brief, research, technology evaluation (Synth Build 1-3)
Done when: PROJECT_BRIEF.md and TECHNOLOGY_EVALUATION.md exist with assumptions and unknowns marked, and a decision record picks the stack.
**Status: done 2026-10-29 (compressed interview, recorded in STATUS.md).**

## Phase 1 — Core voice prototype (Synth Build 4)
Done when: the Rust mono voice passes the offline render suite in TEST_PLAN.md: silence at idle, pitch accuracy at A4, filter darkening measured, legato does not retrigger, glide lands, release reaches silence, renders are deterministic and NaN-free.

## Phase 2 — Playable browser prototype (earliest playable milestone)
Done when: a single-file HTML build plays from the clickable and computer keyboards, every parameter in the registry is on the panel in musical units, 5 presets load, a Hold control exists for ears-on knob testing, and Garth has played it and given a listening verdict (his gate, not Muse's).

## Phase 3 — Sound pass v1.1 (after Garth's listening notes)
Done when: each complaint from Phase 2 maps to a changed parameter/algorithm plus a re-run measurement, and Garth re-checks by ear.

## Explicitly later (not scheduled, each needs Garth's go)
- AudioWorklet audio path (replaces the prototype ScriptProcessor stopgap).
- DAW plugin shell: NIH-plug vs JUCE re-evaluation, VST3/CLAP first, AU on the Mac, signed-in-final-location install rule applies.
- Preset file format (versioned), delay effect, iPad AUv3.

## Owner gates
- Listening sign-off at Phases 2 and 3: Garth.
- Any public release, repo, or plugin phase start: Garth.
