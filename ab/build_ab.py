#!/usr/bin/env python3
"""Build the ElfMono A/B compare page: ONE self-contained HTML file holding
BOTH engines — A = reconstructed Oct 29 build (ab/old, noise + gate-hold
reverted, probe-verified), B = current Oct 30 build (live web/pkg).

Each side's wasm-bindgen no-modules glue declares `let wasm_bindgen`
exactly once; the copies are renamed to wasm_bindgen_a / wasm_bindgen_b so
both can live in one page. Fonts are embedded exactly as in build_web.py.
Outputs: ab/elfmono-ab.html and ~/workspace/your_files/elfmono-ab.html.
"""
import base64, pathlib

AB = pathlib.Path(__file__).resolve().parent
ROOT = AB.parent

def glue_renamed(pkg_dir: pathlib.Path, name: str) -> str:
    glue = (pkg_dir / "elfmono.js").read_text()
    assert glue.count("wasm_bindgen") == 1, f"glue token count != 1 in {pkg_dir}"
    return glue.replace("let wasm_bindgen =", f"let wasm_bindgen_{name} =")

glue_a = glue_renamed(AB / "old" / "web" / "pkg", "a")
glue_b = glue_renamed(ROOT / "web" / "pkg", "b")
wasm_a_b64 = base64.b64encode((AB / "old" / "web" / "pkg" / "elfmono_bg.wasm").read_bytes()).decode()
wasm_b_b64 = base64.b64encode((ROOT / "web" / "pkg" / "elfmono_bg.wasm").read_bytes()).decode()
assert wasm_a_b64 != wasm_b_b64, "old and new WASM are identical — wrong pkg"

FONTS = [
    ("Archivo", "100 900", ROOT / "web" / "fonts" / "archivo-latin-wght.woff2"),
    ("JetBrains Mono", "100 800", ROOT / "web" / "fonts" / "jetbrains-mono-latin-wght.woff2"),
]
font_css = ""
for family, weights, path in FONTS:
    b64 = base64.b64encode(path.read_bytes()).decode()
    font_css += (
        f"@font-face{{font-family:'{family}';"
        f"src:url(data:font/woff2;base64,{b64}) format('woff2');"
        f"font-weight:{weights};font-style:normal;font-display:swap;}}\n  "
    )

tpl = (AB / "template_ab.html").read_text()
for token in ("/*__GLUE_A__*/", "/*__GLUE_B__*/", "__WASM_A_B64__", "__WASM_B_B64__", "/*__FONTS__*/"):
    assert token in tpl, f"missing token {token}"
html = tpl.replace("/*__GLUE_A__*/", glue_a).replace("/*__GLUE_B__*/", glue_b)
html = html.replace("__WASM_A_B64__", wasm_a_b64).replace("__WASM_B_B64__", wasm_b_b64)
html = html.replace("/*__FONTS__*/", font_css)

out1 = AB / "elfmono-ab.html"
out1.write_text(html)
out2 = pathlib.Path.home() / "workspace" / "your_files" / "elfmono-ab.html"
out2.parent.mkdir(parents=True, exist_ok=True)
out2.write_text(html)
print(f"built {out1} and {out2}: {len(html)} bytes")
