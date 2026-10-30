// ElfMono panel — part 2: modulation/output strip with scope, and the keyboard
const fonts = await figma.listAvailableFontsAsync();
function pick(family, styles) {
  for (const s of styles) { const f = fonts.find(f => f.fontName.family === family && f.fontName.style === s); if (f) return f.fontName; }
  const any = fonts.find(f => f.fontName.family === family); if (any) return any.fontName;
  return { family: 'Inter', style: 'Regular' };
}
const F_LABEL = pick('Archivo', ['SemiBold', 'Semi Bold', 'Bold', 'Medium']);
const F_LABEL_R = pick('Archivo', ['Medium', 'Regular']);
const F_MONO = pick('JetBrains Mono', ['Bold', 'Medium', 'Regular']);
const F_MONO_R = pick('JetBrains Mono', ['Regular', 'Medium']);
for (const f of [F_LABEL, F_LABEL_R, F_MONO, F_MONO_R]) await figma.loadFontAsync(f);
const C = {
  bg: {r:0.086,g:0.075,b:0.055}, section: {r:0.125,g:0.108,b:0.078}, sectionLine: {r:0.24,g:0.20,b:0.145},
  knobHi: {r:0.26,g:0.23,b:0.185}, knobLo: {r:0.10,g:0.088,b:0.068}, knobLine: {r:0.38,g:0.32,b:0.24},
  orange: {r:1.0,g:0.545,b:0.10}, amber: {r:1.0,g:0.72,b:0.30},
  text: {r:0.93,g:0.89,b:0.82}, label: {r:0.72,g:0.66,b:0.56}, dim: {r:0.45,g:0.40,b:0.33},
  track: {r:0.23,g:0.20,b:0.16}, lcdBg: {r:0.05,g:0.075,b:0.03},
  white: {r:0.955,g:0.925,b:0.845}, black: {r:0.075,g:0.075,b:0.075},
};
const solid = (c, o) => ({ type: 'SOLID', color: c, ...(o !== undefined ? { opacity: o } : {}) });
const ids = [];
function rect(parent, x, y, w, h, fill, radius, name, stroke) {
  const n = figma.createRectangle(); n.x = x; n.y = y; n.resize(w, h);
  n.fills = fill ? [solid(fill)] : []; if (radius) n.cornerRadius = radius;
  if (stroke) { n.strokes = [solid(stroke)]; n.strokeWeight = 1; }
  if (name) n.name = name; parent.appendChild(n); ids.push(n.id); return n;
}
function ellipse(parent, cx, cy, d, fill, name, stroke) {
  const n = figma.createEllipse(); n.x = cx - d / 2; n.y = cy - d / 2; n.resize(d, d);
  n.fills = fill ? [solid(fill)] : []; if (name) n.name = name;
  if (stroke) { n.strokes = [solid(stroke)]; n.strokeWeight = 1.5; }
  parent.appendChild(n); ids.push(n.id); return n;
}
function text(parent, x, y, str, font, size, color, name, align, ls) {
  const t = figma.createText(); t.fontName = font; t.fontSize = size; t.characters = str;
  t.fills = [solid(color)]; if (align) t.textAlignHorizontal = align;
  if (ls !== undefined) t.letterSpacing = { unit: 'PIXELS', value: ls };
  t.x = x; t.y = y; if (name) t.name = name; parent.appendChild(t); ids.push(t.id); return t;
}
function centered(parent, cx, y, str, font, size, color, name, ls) {
  const t = text(parent, 0, y, str, font, size, color, name, 'CENTER', ls);
  t.resize(240, t.height); t.x = cx - 120; return t;
}
function knob(parent, cx, cy, d, label, valueText, norm, name) {
  const g = figma.createFrame(); g.name = 'Knob/' + name; g.resize(d + 48, d + 56); g.clipsContent = false; g.x = cx - (d + 48) / 2; g.y = cy - (10 + d / 2); g.fills = []; parent.appendChild(g); ids.push(g.id);
  const ccx = (d + 48) / 2, ccy = 10 + d / 2; const R = d / 2 + 9;
  for (let i = 0; i <= 26; i++) {
    const f = i / 26; const a = (135 + 270 * f) * Math.PI / 180;
    ellipse(g, ccx + R * Math.cos(a), ccy + R * Math.sin(a), f <= norm + 0.001 ? 4.4 : 3.2, f <= norm + 0.001 ? C.orange : C.track, 'Arc dot');
  }
  const face = ellipse(g, ccx, ccy, d, C.knobLo, 'Knob face/' + name, C.knobLine);
  face.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0.7, 0.7, 0.1], [-0.7, 0.7, 0.4]], gradientStops: [{ position: 0, color: { ...C.knobHi, a: 1 } }, { position: 1, color: { ...C.knobLo, a: 1 } }] }];
  ellipse(g, ccx, ccy, d * 0.62, C.knobHi, 'Knob cap/' + name).opacity = 0.55;
  const pa = (135 + 270 * norm) * Math.PI / 180;
  ellipse(g, ccx + (d / 2 - 9) * Math.cos(pa), ccy + (d / 2 - 9) * Math.sin(pa), 7, C.amber, 'Pointer/' + name);
  centered(g, ccx, ccy + d / 2 + 8, label, F_LABEL, 10.5, C.label, 'Knob label/' + name, 1);
  centered(g, ccx, ccy + d / 2 + 24, valueText, F_MONO_R, 10, C.orange, 'Knob value/' + name);
  return g;
}
const panel = figma.currentPage.findOne(n => n.name === 'ElfMono Panel');
if (!panel) return { error: 'panel not found', children: figma.currentPage.children.map(c => c.name) };

// ---------- strip: scope + modulation + output ----------
const strip = figma.createFrame(); strip.name = 'Section/MODULATION & OUTPUT'; strip.resize(1272, 170); strip.x = 24; strip.y = 576;
strip.fills = [solid(C.section)]; strip.cornerRadius = 12; strip.strokes = [solid(C.sectionLine)]; strip.strokeWeight = 1;
panel.appendChild(strip); ids.push(strip.id);
text(strip, 16, 12, 'MODULATION & OUTPUT', F_LABEL, 12, C.orange, 'Section title/strip', null, 2);
rect(strip, 16, 36, 1240, 1.5, C.sectionLine, 0, 'Section rule/strip');
// scope screen
rect(strip, 16, 50, 350, 104, C.lcdBg, 8, 'Oscilloscope', C.sectionLine);
const wave = figma.createVector(); wave.name = 'Scope waveform';
let dpath = 'M 8 78';
for (let x = 8; x <= 334; x += 6) { const ph = ((x - 8) / 326) * 3; const cyc = ph % 1; dpath += ` L ${x.toFixed(0)} ${(78 - cyc * 52).toFixed(1)}`; if (cyc > 0.94) dpath += ` L ${x.toFixed(0)} 78`; }
wave.vectorPaths = [{ windingRule: 'NONE', data: dpath }];
wave.strokes = [solid(C.orange)]; wave.strokeWeight = 2; wave.fills = [];
wave.x = 24; wave.y = 58; strip.appendChild(wave); ids.push(wave.id);
text(strip, 24, 132, 'OSC 1 · SAW · A1', F_MONO_R, 9, C.dim, 'Scope caption');
// knobs: LFO rate / to filter / to pitch / glide / drive / volume
knob(strip, 480, 96, 60, 'LFO RATE', '5.0 Hz', 0.72, 'LfoRate');
knob(strip, 620, 96, 60, 'LFO → FILTER', '0%', 0.0, 'LfoToFilter');
knob(strip, 760, 96, 60, 'LFO → PITCH', '0%', 0.0, 'LfoToPitch');
knob(strip, 900, 96, 60, 'GLIDE', '20 ms', 0.04, 'Glide');
knob(strip, 1040, 96, 60, 'DRIVE', '25%', 0.25, 'Drive');
knob(strip, 1185, 92, 72, 'VOLUME', '80%', 0.80, 'Volume');

// ---------- keyboard C2..B4 ----------
const kb = figma.createFrame(); kb.name = 'Keyboard'; kb.resize(1272, 168); kb.x = 24; kb.y = 762; kb.fills = []; kb.clipsContent = false;
panel.appendChild(kb); ids.push(kb.id);
const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const whiteW = 1272 / 21; let wi = 0; const blacks = [];
for (let n = 36; n <= 71; n++) {
  const nm = NAMES[n % 12];
  if (!nm.includes('#')) {
    const k = rect(kb, wi * whiteW, 0, whiteW - 2, 168, C.white, 4, 'Key/' + nm + (Math.floor(n / 12) - 1));
    if (n === 45) { k.fills = [solid(C.orange)]; } // A1 active in the design state
    if (nm === 'C') text(kb, wi * whiteW, 144, nm + (Math.floor(n / 12) - 1), F_LABEL, 10, C.dim, 'Key label/' + n, 'CENTER');
    wi++;
  } else { blacks.push(n); }
}
let bwi = 0; const whiteIndexBefore = {};
{ let w = 0; for (let n = 36; n <= 71; n++) { whiteIndexBefore[n] = w; if (!NAMES[n % 12].includes('#')) w++; } }
for (const n of blacks) {
  const bx = whiteIndexBefore[n] * whiteW - whiteW * 0.31;
  rect(kb, bx, 0, whiteW * 0.62, 104, C.black, 4, 'Key/' + NAMES[n % 12] + (Math.floor(n / 12) - 1), C.sectionLine);
}
text(panel, 24, 936 - 24, '', F_LABEL_R, 10, C.dim, 'noop');
return { created: ids.length, panelId: panel.id, stripId: strip.id, kbId: kb.id };
