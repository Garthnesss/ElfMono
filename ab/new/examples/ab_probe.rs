//! A/B verification probe (2026-10-30): identical code run against the
//! reconstructed OLD engine (ab/old) and the CURRENT engine (ab/new).
//! Sections 1-3 are verbatim from the original render_proof (2026-10-29
//! baselines: deep_bass rms 0.5734 hf 0.022; acid rms 0.3647 hf 0.078;
//! glide rms 0.3889 hf 0.219). Section 4 is render_proof's F3 section with
//! asserts removed (prints only): OLD must print long window 0.0000 and
//! long-vs-short diff ~0.0091; NEW prints 0.2365 / ~0.2285. Section 5 probes
//! param ID 26 (noise_level) with a literal id so it compiles on both
//! engines: OLD must render silence, NEW must render broadband noise.
use elfmono::*;
use std::fs::File;
use std::io::Write;

const SR: f32 = 44_100.0;

fn write_wav(path: &str, samples: &[f32]) {
    let mut f = File::create(path).unwrap();
    let data_len = (samples.len() * 2) as u32;
    f.write_all(b"RIFF").unwrap();
    f.write_all(&(36 + data_len).to_le_bytes()).unwrap();
    f.write_all(b"WAVEfmt ").unwrap();
    f.write_all(&16u32.to_le_bytes()).unwrap();
    f.write_all(&1u16.to_le_bytes()).unwrap(); // PCM
    f.write_all(&1u16.to_le_bytes()).unwrap(); // mono
    f.write_all(&(SR as u32).to_le_bytes()).unwrap();
    f.write_all(&((SR as u32) * 2).to_le_bytes()).unwrap();
    f.write_all(&2u16.to_le_bytes()).unwrap();
    f.write_all(&16u16.to_le_bytes()).unwrap();
    f.write_all(b"data").unwrap();
    f.write_all(&data_len.to_le_bytes()).unwrap();
    for s in samples {
        let v = (s.clamp(-1.0, 1.0) * 32767.0) as i16;
        f.write_all(&v.to_le_bytes()).unwrap();
    }
}

fn report(name: &str, buf: &[f32]) {
    let rms = (buf.iter().map(|x| x * x).sum::<f32>() / buf.len() as f32).sqrt();
    let peak = buf.iter().fold(0.0f32, |a, &b| a.max(b.abs()));
    let nan = buf.iter().any(|x| !x.is_finite());
    let diff_rms = (buf.windows(2).map(|w| (w[1] - w[0]).powi(2)).sum::<f32>() / buf.len() as f32).sqrt();
    println!("{name}: rms={rms:.4} ({:.1} dBFS) peak={peak:.4} hf_ratio={:.3} nan={nan}",
        20.0 * rms.max(1e-9).log10(), diff_rms / rms.max(1e-9));
    assert!(!nan && peak <= 1.0 && rms > 0.01, "{name} failed sanity");
}

fn render(s: &mut MonoSynth, secs: f32) -> Vec<f32> {
    let mut b = vec![0.0; (SR * secs) as usize];
    s.render(&mut b);
    b
}

fn main() {
    std::fs::create_dir_all("tests_render").unwrap();

    // Deep Bass: C2 held
    let mut s = MonoSynth::new(SR);
    s.set_param(P_CUTOFF, 900.0);
    s.set_param(P_RESONANCE, 0.3);
    s.set_param(P_ENV_AMOUNT, 0.5);
    s.set_param(P_SUB_LEVEL, 0.9);
    s.set_param(P_GLIDE_MS, 20.0);
    s.note_on(36, 1.0);
    let buf = render(&mut s, 1.5);
    s.note_off(36);
    report("deep_bass_C2", &buf);
    write_wav("tests_render/deep_bass_C2.wav", &buf);

    // Acid: A1 with resonant env sweep, short decay
    let mut s = MonoSynth::new(SR);
    s.set_param(P_CUTOFF, 700.0);
    s.set_param(P_RESONANCE, 0.85);
    s.set_param(P_ENV_AMOUNT, 0.9);
    s.set_param(P_FILT_D, 300.0);
    s.set_param(P_FILT_S, 0.05);
    s.set_param(P_AMP_D, 300.0);
    s.set_param(P_AMP_S, 0.4);
    s.set_param(P_SUB_LEVEL, 0.2);
    s.note_on(45, 1.0);
    let buf = render(&mut s, 1.5);
    s.note_off(45);
    report("acid_A1", &buf);
    write_wav("tests_render/acid_A1.wav", &buf);

    // Glide Lead: legato phrase C5 -> G5 -> E5 with 180 ms glide
    let mut s = MonoSynth::new(SR);
    s.set_param(P_CUTOFF, 4500.0);
    s.set_param(P_RESONANCE, 0.2);
    s.set_param(P_GLIDE_MS, 180.0);
    s.set_param(P_SUB_LEVEL, 0.0);
    s.set_param(P_OSC2_LEVEL, 0.3);
    let mut buf = Vec::new();
    s.note_on(72, 0.9);
    buf.extend(render(&mut s, 0.5));
    s.note_on(79, 0.9);
    buf.extend(render(&mut s, 0.5));
    s.note_off(79);
    s.note_on(76, 0.9);
    buf.extend(render(&mut s, 0.5));
    s.note_off(76);
    s.note_off(72);
    buf.extend(render(&mut s, 0.3));
    report("glide_lead_phrase", &buf);
    write_wav("tests_render/glide_lead_phrase.wav", &buf);

    // F3 filter-release probe (prints only; asserts live in render_proof):
    // cutoff 300, env_amount 1, default amp release 120 ms; filt release
    // 2000 ms vs 160 ms; window 0.5-2.0 s after note-off.
    let frel_patch = |filt_r: f32| -> Vec<f32> {
        let mut s = MonoSynth::new(SR);
        s.set_param(P_CUTOFF, 300.0);
        s.set_param(P_ENV_AMOUNT, 1.0);
        s.set_param(P_FILT_R, filt_r);
        s.note_on(45, 1.0);
        let mut buf = render(&mut s, 0.35);
        s.note_off(45);
        buf.extend(render(&mut s, 2.45));
        buf
    };
    let win_rms = |buf: &[f32], t0: f32, t1: f32| -> f32 {
        let a = (t0 * SR) as usize;
        let b = ((t1 * SR) as usize).min(buf.len());
        (buf[a..b].iter().map(|x| x * x).sum::<f32>() / (b - a) as f32).sqrt()
    };
    let long = frel_patch(2000.0);
    let short = frel_patch(160.0);
    let long_win = win_rms(&long, 0.85, 2.35);
    let short_win = win_rms(&short, 0.85, 2.35);
    let fr_diff = (long.iter().zip(&short).map(|(a, b)| (a - b).powi(2)).sum::<f32>()
        / long.len() as f32)
        .sqrt();
    println!("filt_release tail window (0.5-2.0 s after note-off): long(2000 ms)={long_win:.4} short(160 ms)={short_win:.4}");
    println!("filt_release long-vs-short: diff_rms={fr_diff:.4}");

    // Param-26 probe: noise-only patch (all pitched sources at 0, filter
    // open). OLD engine has no param 26 -> exact silence. NEW -> noise.
    let mut s = MonoSynth::new(SR);
    s.set_param(P_OSC1_LEVEL, 0.0);
    s.set_param(P_OSC2_LEVEL, 0.0);
    s.set_param(P_SUB_LEVEL, 0.0);
    s.set_param(P_CUTOFF, 18_000.0);
    s.set_param(P_ENV_AMOUNT, 0.0);
    s.set_param(P_KEY_TRACK, 0.0);
    s.set_param(P_DRIVE, 0.0);
    s.set_param(26, 1.0);
    s.note_on(57, 1.0);
    let buf = render(&mut s, 1.0);
    let half = &buf[buf.len() / 2..];
    let nrms = (half.iter().map(|x| x * x).sum::<f32>() / half.len() as f32).sqrt();
    println!("param26 noise-only probe (2nd half): rms={nrms:.4}");

    println!("ab_probe OK");
}
