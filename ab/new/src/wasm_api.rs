use crate::MonoSynth;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmSynth {
    inner: MonoSynth,
    left: Vec<f32>,
    right: Vec<f32>,
}

#[wasm_bindgen]
impl WasmSynth {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> WasmSynth {
        WasmSynth { inner: MonoSynth::new(sample_rate), left: vec![0.0; 8192], right: vec![0.0; 8192] }
    }
    pub fn note_on(&mut self, note: u8, velocity: f32) {
        self.inner.note_on(note, velocity);
    }
    pub fn note_off(&mut self, note: u8) {
        self.inner.note_off(note);
    }
    pub fn set_param(&mut self, id: u32, value: f32) {
        self.inner.set_param(id, value);
    }
    pub fn render_block(&mut self, len: usize) {
        let len = len.min(8192);
        for i in 0..len {
            let s = self.inner.process_sample();
            self.left[i] = s;
            self.right[i] = s;
        }
    }
    /// JS-friendly block render: returns a fresh Float32Array for the audio callback.
    /// (The allocation is in this binding layer, not in the core render path.)
    pub fn render_js(&mut self, len: usize) -> Vec<f32> {
        let len = len.min(8192);
        let mut out = Vec::with_capacity(len);
        for _ in 0..len {
            out.push(self.inner.process_sample());
        }
        out
    }
    pub fn left_ptr(&self) -> *const f32 {
        self.left.as_ptr()
    }
    pub fn right_ptr(&self) -> *const f32 {
        self.right.as_ptr()
    }
}
