//! Adversarial param audit: for every parameter, render a scenario built to expose it,
//! once at baseline and once with the parameter changed, and measure the difference.
//! A parameter that produces no measurable difference in its own scenario is flagged NONE.
//! Run: cargo run --release --example audit_probe
use elfmono::*;

const SR: f32 = 44_100.0;

fn render(s: &mut MonoSynth, secs: f32) -> Vec<f32> {
    let mut b = vec![0.0; (SR * secs) as usize];
    s.render(&mut b);
    b
}
fn script_hold45(s: &mut MonoSynth) -> Vec<f32> { s.note_on(45, 1.0); render(s, 0.7) }
fn script_hold69(s: &mut MonoSynth) -> Vec<f32> { s.note_on(69, 1.0); render(s, 0.7) }
fn script_glide(s: &mut MonoSynth) -> Vec<f32> {
    s.note_on(60, 1.0); let mut o = render(s, 0.25); s.note_on(72, 1.0); o.extend(render(s, 0.55)); o
}
fn script_legato(s: &mut MonoSynth) -> Vec<f32> {
    s.note_on(60, 1.0); let mut o = render(s, 0.3); s.note_on(67, 1.0); o.extend(render(s, 0.4)); o
}
fn script_tail(s: &mut MonoSynth) -> Vec<f32> {
    s.note_on(45, 1.0); let mut o = render(s, 0.35); s.note_off(45); o.extend(render(s, 0.8)); o
}

type Setup = fn(&mut MonoSynth, bool);
type Script = fn(&mut MonoSynth) -> Vec<f32>;
struct Probe { id: u32, name: &'static str, setup: Setup, script: Script }
fn noop(_: &mut MonoSynth, _: bool) {}

fn run(p: &Probe) -> (f32, f32) {
    let mut a = MonoSynth::new(SR); (p.setup)(&mut a, false); let base = (p.script)(&mut a);
    let mut b = MonoSynth::new(SR); (p.setup)(&mut b, true); let var = (p.script)(&mut b);
    let n = base.len().min(var.len());
    let diff = (base[..n].iter().zip(&var[..n]).map(|(x, y)| (x - y).powi(2)).sum::<f32>() / n as f32).sqrt();
    let rms = (base[..n].iter().map(|x| x * x).sum::<f32>() / n as f32).sqrt();
    (diff, rms)
}

fn main() {
    let probes: Vec<Probe> = vec![
        Probe { id: 0, name: "osc1_wave -> tri", setup: |s, v| { if v { s.set_param(P_OSC1_WAVE, 2.0); } }, script: script_hold45 },
        Probe { id: 1, name: "osc1_level -> 0", setup: |s, v| { if v { s.set_param(P_OSC1_LEVEL, 0.0); } }, script: script_hold45 },
        Probe { id: 2, name: "osc2_wave -> tri", setup: |s, v| { if v { s.set_param(P_OSC2_WAVE, 2.0); } }, script: script_hold45 },
        Probe { id: 3, name: "osc2_detune -> +600ct", setup: |s, v| { if v { s.set_param(P_OSC2_DETUNE, 600.0); } }, script: script_hold45 },
        Probe { id: 4, name: "osc2_level -> 0", setup: |s, v| { if v { s.set_param(P_OSC2_LEVEL, 0.0); } }, script: script_hold45 },
        Probe { id: 5, name: "sub_level -> 0", setup: |s, v| { if v { s.set_param(P_SUB_LEVEL, 0.0); } }, script: script_hold45 },
        Probe { id: 6, name: "pulse_width -> 0.25 (square ctx)", setup: |s, v| { s.set_param(P_OSC1_WAVE, 1.0); if v { s.set_param(P_PULSE_WIDTH, 0.25); } }, script: script_hold45 },
        Probe { id: 7, name: "cutoff -> 200 Hz", setup: |s, v| { if v { s.set_param(P_CUTOFF, 200.0); } }, script: script_hold45 },
        Probe { id: 8, name: "resonance -> 0.9 (fc 1200 ctx)", setup: |s, v| { s.set_param(P_CUTOFF, 1200.0); if v { s.set_param(P_RESONANCE, 0.9); } }, script: script_hold45 },
        Probe { id: 9, name: "env_amount -> 0 (fc 800 ctx)", setup: |s, v| { s.set_param(P_CUTOFF, 800.0); if v { s.set_param(P_ENV_AMOUNT, 0.0); } }, script: script_hold45 },
        Probe { id: 10, name: "key_track -> 1 (fc 400, A4 ctx)", setup: |s, v| { s.set_param(P_CUTOFF, 400.0); s.set_param(P_ENV_AMOUNT, 0.0); if v { s.set_param(P_KEY_TRACK, 1.0); } }, script: script_hold69 },
        Probe { id: 11, name: "glide -> 300 ms (phrase ctx)", setup: |s, v| { if v { s.set_param(P_GLIDE_MS, 300.0); } }, script: script_glide },
        Probe { id: 12, name: "legato -> off (retrigger ctx)", setup: |s, v| { s.set_param(P_AMP_D, 120.0); s.set_param(P_AMP_S, 0.2); if v { s.set_param(P_LEGATO, 0.0); } }, script: script_legato },
        Probe { id: 13, name: "amp_attack -> 800 ms", setup: |s, v| { if v { s.set_param(P_AMP_A, 800.0); } }, script: script_hold45 },
        Probe { id: 14, name: "amp_decay -> 1000 ms (S 0.1 ctx)", setup: |s, v| { s.set_param(P_AMP_S, 0.1); if v { s.set_param(P_AMP_D, 1000.0); } }, script: script_hold45 },
        Probe { id: 15, name: "amp_sustain -> 0.1 (D 100 ctx)", setup: |s, v| { s.set_param(P_AMP_D, 100.0); if v { s.set_param(P_AMP_S, 0.1); } }, script: script_hold45 },
        Probe { id: 16, name: "amp_release -> 2000 ms (tail ctx)", setup: |s, v| { if v { s.set_param(P_AMP_R, 2000.0); } }, script: script_tail },
        Probe { id: 17, name: "filt_attack -> 600 ms (env ctx)", setup: |s, v| { s.set_param(P_CUTOFF, 300.0); s.set_param(P_ENV_AMOUNT, 1.0); if v { s.set_param(P_FILT_A, 600.0); } }, script: script_hold45 },
        Probe { id: 18, name: "filt_decay -> 1200 ms (env/S .1 ctx)", setup: |s, v| { s.set_param(P_CUTOFF, 300.0); s.set_param(P_ENV_AMOUNT, 1.0); s.set_param(P_FILT_S, 0.1); if v { s.set_param(P_FILT_D, 1200.0); } }, script: script_hold45 },
        Probe { id: 19, name: "filt_sustain -> 0.9 (env/D 100 ctx)", setup: |s, v| { s.set_param(P_CUTOFF, 300.0); s.set_param(P_ENV_AMOUNT, 1.0); s.set_param(P_FILT_D, 100.0); if v { s.set_param(P_FILT_S, 0.9); } }, script: script_hold45 },
        Probe { id: 20, name: "filt_release -> 2000 ms (env tail ctx)", setup: |s, v| { s.set_param(P_CUTOFF, 300.0); s.set_param(P_ENV_AMOUNT, 1.0); if v { s.set_param(P_FILT_R, 2000.0); } }, script: script_tail },
        Probe { id: 21, name: "lfo_rate -> 12 Hz (lfo->filt ctx)", setup: |s, v| { s.set_param(P_LFO_FILTER, 0.8); if v { s.set_param(P_LFO_RATE, 12.0); } }, script: script_hold45 },
        Probe { id: 22, name: "lfo_to_filter -> 0.9", setup: |s, v| { if v { s.set_param(P_LFO_FILTER, 0.9); } }, script: script_hold45 },
        Probe { id: 23, name: "lfo_to_pitch -> 0.9", setup: |s, v| { if v { s.set_param(P_LFO_PITCH, 0.9); } }, script: script_hold45 },
        Probe { id: 24, name: "drive -> 1.0", setup: |s, v| { if v { s.set_param(P_DRIVE, 1.0); } }, script: script_hold45 },
        Probe { id: 25, name: "volume -> 0.2", setup: |s, v| { if v { s.set_param(P_VOLUME, 0.2); } }, script: script_hold45 },
        Probe { id: 26, name: "noise_level -> 0.8", setup: |s, v| { if v { s.set_param(P_NOISE_LEVEL, 0.8); } }, script: script_hold45 },
    ];
    println!("{:>3}  {:<42} {:>9} {:>9}  {}", "ID", "probe", "diffRMS", "baseRMS", "verdict");
    let mut none = 0;
    for p in &probes {
        let (diff, rms) = run(p);
        let verdict = if diff > 0.005 { "LIVE" } else if diff > 0.0005 { "WEAK" } else { none += 1; "NONE" };
        println!("{:>3}  {:<42} {:>9.4} {:>9.4}  {}", p.id, p.name, diff, rms, verdict);
    }
    let _ = noop;
    println!("\n{} probes, {} NONE", probes.len(), none);
}
