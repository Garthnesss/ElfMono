// Stub-DOM smoke test of the A/B page's MAIN script (script block 2):
// runs the real built script against a permissive fake DOM and exercises
// the new A/B code paths — wire-up syncSideUI, setSide both ways, the
// BREATH-on-A fallback, and preset application with no engines started.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(process.argv[2], 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

class El {
  constructor(tag) {
    this.tagName = tag; this.children = []; this.style = {}; this.dataset = {};
    this._cls = new Set(); this.textContent = ''; this.innerHTML = ''; this.tabIndex = 0;
  }
  get classList() {
    const s = this._cls;
    return {
      add: c => s.add(c), remove: c => s.delete(c),
      toggle: (c, f) => { if (f === undefined) f = !s.has(c); f ? s.add(c) : s.delete(c); },
      contains: c => s.has(c),
    };
  }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._cls].join(' '); }
  appendChild(c) { this.children.push(c); return c; }
  addEventListener() {}
  setAttribute() {}
  getAttribute() { return null; }
  querySelector() { return new El('div'); }
  querySelectorAll() { return []; }
  setPointerCapture() {}
  getBoundingClientRect() { return { top: 0, left: 0, height: 100, width: 100 }; }
  getContext() { return { fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} }; }
}
const byId = {};
const documentStub = {
  getElementById: id => byId[id] || (byId[id] = new El('div')),
  createElement: t => new El(t),
  querySelectorAll: () => [],
  currentScript: null,
};
const sandbox = { console, document: documentStub, atob, TextDecoder, TextEncoder };
sandbox.window = sandbox;
sandbox.addEventListener = () => {};
vm.createContext(sandbox);

vm.runInContext(scripts[2], sandbox); // main script: builds panel/presets/keys + wire-up syncSideUI()
console.log('PASS  main script loads + wire-up syncSideUI() ran (boot side A)');

const probe = vm.runInContext(`
  const out = {};
  out.bootSide = side;
  setSide('B'); out.afterB = side;
  applyPreset('BREATH'); out.presetOnB = currentPreset;
  setSide('A'); out.afterA = side; out.presetAfterFallback = currentPreset;
  setSide('B'); out.backOnB = side;
  applyPreset('ACID'); out.presetAcid = currentPreset;
  out.noiseKnobDisabledOnB = knobs.find(k => k.id === 26).wrap.classList.contains('disabled');
  setSide('A');
  out.noiseKnobDisabledOnA = knobs.find(k => k.id === 26).wrap.classList.contains('disabled');
  JSON.stringify(out);
`, sandbox);
const r = JSON.parse(probe);
console.log('probe:', JSON.stringify(r));

let fail = 0;
const check = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) fail++; };
check('boots on side A', r.bootSide === 'A');
check('setSide B works', r.afterB === 'B');
check('BREATH applies on B', r.presetOnB === 'BREATH');
check('switching to A with BREATH falls back to INIT', r.afterA === 'A' && r.presetAfterFallback === 'INIT');
check('noise knob enabled on B', r.noiseKnobDisabledOnB === false);
check('noise knob disabled on A', r.noiseKnobDisabledOnA === true);
check('ACID applies after flips', r.presetAcid === 'ACID');
process.exit(fail ? 1 : 0);
