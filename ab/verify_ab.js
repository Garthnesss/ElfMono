// Headless verification of the built A/B page (ab/elfmono-ab.html):
//  1. every <script> block in the page parses (vm.Script compile check)
//  2. both embedded glues instantiate their WASM in one shared context
//     (proves the wasm_bindgen_a / wasm_bindgen_b rename works)
//  3. both embedded engines render non-silent audio at defaults
//  4. DECISIVE A/B probes through the actual embedded WASMs:
//     - filter-release tail window (F3): A ~= 0.0000, B ~= 0.2365
//     - param-26 noise-only probe:      A == 0.0000, B ~= 0.3360
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(process.argv[2], 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
console.log(`script blocks: ${scripts.length}`);
scripts.forEach((s, i) => { new vm.Script(s); console.log(`  script ${i}: parses OK (${s.length} chars)`); });

const b64of = name => {
  const m = html.match(new RegExp(`const ${name} = "([A-Za-z0-9+/=]+)"`));
  if (!m) throw new Error(`missing ${name}`);
  return m[1];
};

const sandbox = { console, atob, TextDecoder, TextEncoder };
vm.createContext(sandbox);
vm.runInContext(scripts[0], sandbox); // glue A
vm.runInContext(scripts[1], sandbox); // glue B

const driver = `
const b64ToBytes = b64 => { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
wasm_bindgen_a.initSync({ module: b64ToBytes(${JSON.stringify(b64of('WASM_A_B64'))}) });
wasm_bindgen_b.initSync({ module: b64ToBytes(${JSON.stringify(b64of('WASM_B_B64'))}) });
const SR = 44100;
function renderN(s, n) { const out = []; let left = n; while (left > 0) { const k = Math.min(8192, left); const blk = s.render_js(k); for (let i = 0; i < blk.length; i++) out.push(blk[i]); left -= k; } return out; }
function rms(buf, a = 0, b = buf.length) { let acc = 0; for (let i = a; i < b; i++) acc += buf[i] * buf[i]; return Math.sqrt(acc / (b - a)); }
function f3Window(Synth) {
  const s = new Synth(SR);
  s.set_param(7, 300.0); s.set_param(9, 1.0); s.set_param(20, 2000.0);
  s.note_on(45, 1.0);
  let buf = renderN(s, Math.round(0.35 * SR));
  s.note_off(45);
  buf = buf.concat(renderN(s, Math.round(2.45 * SR)));
  return rms(buf, Math.round(0.85 * SR), Math.round(2.35 * SR));
}
function noiseProbe(Synth) {
  const s = new Synth(SR);
  s.set_param(1, 0.0); s.set_param(4, 0.0); s.set_param(5, 0.0);
  s.set_param(7, 18000.0); s.set_param(9, 0.0); s.set_param(10, 0.0); s.set_param(24, 0.0);
  s.set_param(26, 1.0);
  s.note_on(57, 1.0);
  const buf = renderN(s, SR);
  return rms(buf, SR / 2);
}
function heldDefault(Synth) {
  const s = new Synth(SR);
  s.note_on(45, 0.9);
  return rms(renderN(s, Math.round(0.5 * SR)));
}
JSON.stringify({
  heldA: heldDefault(wasm_bindgen_a.WasmSynth),
  heldB: heldDefault(wasm_bindgen_b.WasmSynth),
  f3A: f3Window(wasm_bindgen_a.WasmSynth),
  f3B: f3Window(wasm_bindgen_b.WasmSynth),
  noiseA: noiseProbe(wasm_bindgen_a.WasmSynth),
  noiseB: noiseProbe(wasm_bindgen_b.WasmSynth),
});
`;
const r = JSON.parse(vm.runInContext(driver, sandbox));
console.log('results:', JSON.stringify(r, null, 1));

let fail = 0;
const check = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) fail++; };
check(`held default non-silent both sides (A ${r.heldA.toFixed(4)}, B ${r.heldB.toFixed(4)})`, r.heldA > 0.05 && r.heldB > 0.05);
check(`F3 tail window A truncated (${r.f3A.toFixed(4)} < 0.0005)`, r.f3A < 0.0005);
check(`F3 tail window B held (${r.f3B.toFixed(4)} ~= 0.2365)`, Math.abs(r.f3B - 0.2365) < 0.01);
check(`noise probe A silent (${r.noiseA.toFixed(6)} == 0)`, r.noiseA < 1e-6);
check(`noise probe B sounds (${r.noiseB.toFixed(4)} ~= 0.3360)`, Math.abs(r.noiseB - 0.3360) < 0.02);
process.exit(fail ? 1 : 0);
