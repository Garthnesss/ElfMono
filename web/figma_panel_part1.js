const old = await figma.getNodeByIdAsync('2:2'); if (old) old.remove();
// ElfMono panel — part 1: panel, top bar, sections, knobs, switches, scope
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
const F_LOGO = pick('Archivo', ['Black', 'ExtraBold', 'Bold']);
for (const f of [F_LABEL, F_LABEL_R, F_MONO, F_MONO_R, F_LOGO]) await figma.loadFontAsync(f);

const C = {
  bg: {r:0.086,g:0.075,b:0.055}, section: {r:0.125,g:0.108,b:0.078}, sectionLine: {r:0.24,g:0.20,b:0.145},
  knobHi: {r:0.26,g:0.23,b:0.185}, knobLo: {r:0.10,g:0.088,b:0.068}, knobLine: {r:0.38,g:0.32,b:0.24},
  orange: {r:1.0,g:0.545,b:0.10}, amber: {r:1.0,g:0.72,b:0.30}, dim: {r:0.45,g:0.40,b:0.33},
  text: {r:0.93,g:0.89,b:0.82}, label: {r:0.72,g:0.66,b:0.56},
  lcdBg: {r:0.05,g:0.075,b:0.03}, lcdText: {r:0.62,g:0.95,b:0.42},
  ledRed: {r:1.0,g:0.25,b:0.18}, track: {r:0.23,g:0.20,b:0.16},
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

// ---------- panel ----------
const page = figma.currentPage;
const panel = figma.createFrame(); panel.name = 'ElfMono Panel'; panel.resize(1320, 960);
panel.fills = [solid(C.bg)]; panel.cornerRadius = 18; panel.x = 0; panel.y = 0;
panel.strokes = [solid(C.sectionLine)]; panel.strokeWeight = 2;
page.appendChild(panel); ids.push(panel.id);
// corner screws
for (const [sx, sy] of [[22,22],[1298,22],[22,938],[1298,938]]) {
  ellipse(panel, sx, sy, 14, C.knobLo, 'Screw', C.knobLine); ellipse(panel, sx, sy, 4, C.dim, 'Screw dot');
}
// ---------- top bar ----------
text(panel, 44, 26, 'ELFMONO', F_LOGO, 34, C.text, 'Logo');
text(panel, 45, 66, 'M O N O P H O N I C   S Y N T H E S I Z E R', F_LABEL, 10, C.orange, 'Tagline');
// LCD display
const lcd = rect(panel, 330, 22, 400, 66, C.lcdBg, 8, 'LCD display', C.sectionLine);
text(panel, 348, 34, 'DEEP BASS', F_MONO, 22, C.lcdText, 'LCD preset name');
text(panel, 348, 62, 'CUTOFF 900 Hz · GLIDE 20 ms', F_MONO_R, 12, C.lcdText, 'LCD last-touched readout').opacity = 0.85;
ellipse(panel, 712, 42, 8, C.ledRed, 'LCD gate LED');
// preset strip
const presetNames = ['INIT','DEEP BASS','ACID','GLIDE LEAD','SUB','PULSE'];
let px = 762;
for (const pn of presetNames) {
  const w = pn.length * 7.4 + 22; const active = pn === 'DEEP BASS';
  const b = rect(panel, px, 24, w, 30, active ? C.orange : C.section, 15, 'Preset/' + pn, active ? null : C.sectionLine);
  const t = text(panel, px, 32, pn, F_LABEL, 10.5, active ? C.bg : C.label, 'Preset label/' + pn, 'CENTER');
  t.resize(w, t.height); t.x = px; px += w + 8;
}
// hold + legato toggles (top right)
function toggle(x, y, label, on) {
  const g = figma.createFrame(); g.name = 'Toggle/' + label; g.resize(104, 30); g.x = x; g.y = y; g.fills = [solid(C.section)]; g.cornerRadius = 6; g.strokes = [solid(C.sectionLine)]; g.strokeWeight = 1; panel.appendChild(g); ids.push(g.id);
  ellipse(g, 16, 15, 9, on ? C.orange : C.track, 'Toggle LED/' + label);
  const t = text(g, 28, 8, label, F_LABEL, 11, on ? C.text : C.label, 'Toggle label/' + label);
  return g;
}
toggle(762, 62, 'HOLD', false);
toggle(878, 62, 'LEGATO', true);
text(panel, 1010, 68, 'Designed by Garth Elfstrom', F_LABEL_R, 11, C.dim, 'Footer credit');

// ---------- sections ----------
function section(x, y, w, h, title) {
  const s = figma.createFrame(); s.name = 'Section/' + title; s.resize(w, h); s.x = x; s.y = y;
  s.fills = [solid(C.section)]; s.cornerRadius = 12; s.strokes = [solid(C.sectionLine)]; s.strokeWeight = 1;
  panel.appendChild(s); ids.push(s.id);
  text(s, 16, 12, title, F_LABEL, 12, C.orange, 'Section title/' + title, null, 2);
  rect(s, 16, 36, w - 32, 1.5, C.sectionLine, 0, 'Section rule/' + title);
  return s;
}
const secOsc = section(24, 108, 400, 452, 'OSCILLATORS');
const secFilt = section(440, 108, 400, 452, 'FILTER');
const secEnv = section(856, 108, 440, 452, 'ENVELOPES');

// ---------- knob factory ----------
// value arc = LED dot ring (27 dots over 270 deg), pointer dot on the face.
function knob(parent, cx, cy, d, label, valueText, norm, name) {
  const g = figma.createFrame(); g.name = 'Knob/' + name; g.resize(d + 48, d + 56); g.clipsContent = false; g.x = cx - (d + 48) / 2; g.y = cy - (10 + d / 2); g.fills = []; parent.appendChild(g); ids.push(g.id);
  const ccx = (d + 48) / 2, ccy = 10 + d / 2;
  const R = d / 2 + 9;
  for (let i = 0; i <= 26; i++) {
    const f = i / 26; const a = (135 + 270 * f) * Math.PI / 180;
    const dx = ccx + R * Math.cos(a), dy = ccy + R * Math.sin(a);
    ellipse(g, dx, dy, f <= norm + 0.001 ? 4.4 : 3.2, f <= norm + 0.001 ? C.orange : C.track, 'Arc dot');
  }
  const face = ellipse(g, ccx, ccy, d, C.knobLo, 'Knob face/' + name, C.knobLine);
  face.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0.7, 0.7, 0.1], [-0.7, 0.7, 0.4]], gradientStops: [{ position: 0, color: { ...C.knobHi, a: 1 } }, { position: 1, color: { ...C.knobLo, a: 1 } }] }];
  ellipse(g, ccx, ccy, d * 0.62, C.knobHi, 'Knob cap/' + name).opacity = 0.55;
  const pa = (135 + 270 * norm) * Math.PI / 180;
  ellipse(g, ccx + (d / 2 - 9) * Math.cos(pa), ccy + (d / 2 - 9) * Math.sin(pa), 7, C.amber, 'Pointer/' + name);
  centered(g, ccx, ccy + d / 2 + 8, label, F_LABEL, 10.5, C.label, 'Knob label/' + name, 1);
  const vt = centered(g, ccx, ccy + d / 2 + 24, valueText, F_MONO_R, 10, C.orange, 'Knob value/' + name);
  return g;
}
// wave selector chips
function waveChips(parent, x, y, label, activeIdx) {
  text(parent, x, y, label, F_LABEL, 10, C.label, 'Wave label/' + label, null, 1);
  ['SAW','SQR','TRI'].forEach((w, i) => {
    const bx = x + i * 62;
    const active = i === activeIdx;
    rect(parent, bx, y + 18, 54, 24, active ? C.orange : C.bg, 5, 'Wave chip/' + label + '/' + w, active ? null : C.sectionLine);
    const t = text(parent, bx, y + 24, w, F_LABEL, 10, active ? C.bg : C.label, 'Wave chip text/' + w, 'CENTER'); t.resize(54, t.height); t.x = bx;
  });
}

// OSCILLATORS — Deep Bass state
knob(secOsc, 105, 106, 72, 'OSC 1 LEVEL', '80%', 0.80, 'Osc1Level');
knob(secOsc, 295, 106, 72, 'OSC 2 DETUNE', '+5 ct', 0.502, 'Osc2Detune');
knob(secOsc, 105, 244, 72, 'OSC 2 LEVEL', '35%', 0.35, 'Osc2Level');
knob(secOsc, 295, 244, 72, 'SUB LEVEL', '90%', 0.90, 'SubLevel');
knob(secOsc, 105, 374, 56, 'PULSE WIDTH', '50%', 0.50, 'PulseWidth');
waveChips(secOsc, 196, 330, 'OSC 1 WAVE', 0);
waveChips(secOsc, 196, 386, 'OSC 2 WAVE', 0);

// FILTER — hero cutoff
knob(secFilt, 200, 146, 118, 'CUTOFF', '900 Hz', 0.510, 'Cutoff');
knob(secFilt, 95, 336, 68, 'RESONANCE', '30%', 0.306, 'Resonance');
knob(secFilt, 200, 336, 68, 'ENV AMOUNT', '+50%', 0.75, 'EnvAmount');
knob(secFilt, 305, 336, 68, 'KEY TRACK', '30%', 0.30, 'KeyTrack');
// cutoff scale print (computed from the real log law: 40 Hz..18 kHz)
for (const [lbl, f] of [['40', 0], ['200', 0.264], ['1k', 0.527], ['5k', 0.791], ['18k', 1]]) {
  const a = (135 + 270 * f) * Math.PI / 180; const R = 86;
  centered(secFilt, 200 + R * Math.cos(a), 146 + R * Math.sin(a) - 6, lbl, F_MONO_R, 9, C.dim, 'Cutoff scale/' + lbl);
}

// ENVELOPES — two ADSR rows of small knobs
function adsrRow(parent, y, title, vals) {
  text(parent, 16, y - 34, title, F_LABEL, 10.5, C.text, 'ADSR title/' + title, null, 1.5);
  const xs = [58, 160, 262, 364];
  vals.forEach((v, i) => knob(parent, xs[i], y + 14, 52, v[0], v[1], v[2], title + '/' + v[0]));
}
adsrRow(secEnv, 96, 'AMP ENVELOPE', [['ATTACK', '3 ms', 0.145], ['DECAY', '250 ms', 0.726], ['SUSTAIN', '90%', 0.90], ['RELEASE', '120 ms', 0.40]]);
adsrRow(secEnv, 244, 'FILTER ENVELOPE', [['ATTACK', '2 ms', 0.091], ['DECAY', '220 ms', 0.71], ['SUSTAIN', '25%', 0.25], ['RELEASE', '160 ms', 0.446]]);
text(secEnv, 16, 356, 'LEGATO', F_LABEL, 10.5, C.label, 'Legato label', null, 1);
rect(secEnv, 16, 384, 72, 28, C.bg, 6, 'Legato switch', C.sectionLine);
rect(secEnv, 20, 388, 32, 20, C.orange, 4, 'Legato switch knob');
text(secEnv, 62, 391, 'ON', F_LABEL, 10, C.orange, 'Legato on text');
text(secEnv, 120, 360, 'Play overlapping notes: envelopes do not retrigger, pitch glides to the new note.', F_LABEL_R, 11, C.dim, 'Legato explainer');
return { created: ids.length, panelId: panel.id, fonts: { label: F_LABEL, mono: F_MONO, logo: F_LOGO } };
