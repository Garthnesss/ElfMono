let wasm_bindgen = (function(exports) {
    let script_src;
    if (typeof document !== 'undefined' && document.currentScript !== null) {
        script_src = new URL(document.currentScript.src, location.href).toString();
    }

    class WasmSynth {
        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            WasmSynthFinalization.unregister(this);
            return ptr;
        }
        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_wasmsynth_free(ptr, 0);
        }
        /**
         * @returns {number}
         */
        left_ptr() {
            const ret = wasm.wasmsynth_left_ptr(this.__wbg_ptr);
            return ret >>> 0;
        }
        /**
         * @param {number} sample_rate
         */
        constructor(sample_rate) {
            const ret = wasm.wasmsynth_new(sample_rate);
            this.__wbg_ptr = ret;
            WasmSynthFinalization.register(this, this.__wbg_ptr, this);
            return this;
        }
        /**
         * @param {number} note
         */
        note_off(note) {
            wasm.wasmsynth_note_off(this.__wbg_ptr, note);
        }
        /**
         * @param {number} note
         * @param {number} velocity
         */
        note_on(note, velocity) {
            wasm.wasmsynth_note_on(this.__wbg_ptr, note, velocity);
        }
        /**
         * @param {number} len
         */
        render_block(len) {
            wasm.wasmsynth_render_block(this.__wbg_ptr, len);
        }
        /**
         * JS-friendly block render: returns a fresh Float32Array for the audio callback.
         * (The allocation is in this binding layer, not in the core render path.)
         * @param {number} len
         * @returns {Float32Array}
         */
        render_js(len) {
            const ret = wasm.wasmsynth_render_js(this.__wbg_ptr, len);
            var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
            return v1;
        }
        /**
         * @returns {number}
         */
        right_ptr() {
            const ret = wasm.wasmsynth_right_ptr(this.__wbg_ptr);
            return ret >>> 0;
        }
        /**
         * @param {number} id
         * @param {number} value
         */
        set_param(id, value) {
            wasm.wasmsynth_set_param(this.__wbg_ptr, id, value);
        }
    }
    if (Symbol.dispose) WasmSynth.prototype[Symbol.dispose] = WasmSynth.prototype.free;
    exports.WasmSynth = WasmSynth;
    function __wbg_get_imports() {
        const import0 = {
            __proto__: null,
            __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
                throw new Error(getStringFromWasm0(arg0, arg1));
            },
            __wbindgen_init_externref_table: function() {
                const table = wasm.__wbindgen_externrefs;
                const offset = table.grow(4);
                table.set(0, undefined);
                table.set(offset + 0, undefined);
                table.set(offset + 1, null);
                table.set(offset + 2, true);
                table.set(offset + 3, false);
            },
        };
        return {
            __proto__: null,
            "./elfmono_bg.js": import0,
        };
    }

    const WasmSynthFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_wasmsynth_free(ptr, 1));

    function getArrayF32FromWasm0(ptr, len) {
        ptr = ptr >>> 0;
        return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
    }

    let cachedFloat32ArrayMemory0 = null;
    function getFloat32ArrayMemory0() {
        if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
            cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
        }
        return cachedFloat32ArrayMemory0;
    }

    function getStringFromWasm0(ptr, len) {
        return decodeText(ptr >>> 0, len);
    }

    let cachedUint8ArrayMemory0 = null;
    function getUint8ArrayMemory0() {
        if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
            cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8ArrayMemory0;
    }

    let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    function decodeText(ptr, len) {
        return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
    }

    let wasmModule, wasmInstance, wasm;
    function __wbg_finalize_init(instance, module) {
        wasmInstance = instance;
        wasm = instance.exports;
        wasmModule = module;
        cachedFloat32ArrayMemory0 = null;
        cachedUint8ArrayMemory0 = null;
        wasm.__wbindgen_start();
        return wasm;
    }

    async function __wbg_load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (!module.ok) {
                throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
            }

            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);
                } catch (e) {
                    const validResponse = expectedResponseType(module.type);

                    if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else { throw e; }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);
        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };
            } else {
                return instance;
            }
        }

        function expectedResponseType(type) {
            switch (type) {
                case 'basic': case 'cors': case 'default': return true;
            }
            return false;
        }
    }

    function initSync(module) {
        if (wasm !== undefined) return wasm;


        if (module !== undefined) {
            if (Object.getPrototypeOf(module) === Object.prototype) {
                ({module} = module)
            } else {
                console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
            }
        }

        const imports = __wbg_get_imports();
        if (!(module instanceof WebAssembly.Module)) {
            module = new WebAssembly.Module(module);
        }
        const instance = new WebAssembly.Instance(module, imports);
        return __wbg_finalize_init(instance, module);
    }

    async function __wbg_init(module_or_path) {
        if (wasm !== undefined) return wasm;


        if (module_or_path !== undefined) {
            if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
                ({module_or_path} = module_or_path)
            } else {
                console.warn('using deprecated parameters for the initialization function; pass a single object instead')
            }
        }

        if (module_or_path === undefined && script_src !== undefined) {
            module_or_path = script_src.replace(/\.js$/, "_bg.wasm");
        }
        const imports = __wbg_get_imports();

        if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
            module_or_path = fetch(module_or_path);
        }

        const { instance, module } = await __wbg_load(await module_or_path, imports);

        return __wbg_finalize_init(instance, module);
    }

    return Object.assign(__wbg_init, { initSync }, exports);
})({ __proto__: null });
