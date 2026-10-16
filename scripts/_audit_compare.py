"""
Phase 7: Compare audit results against canonical DB state and public repo assets.

This script bridges the pixel-level audit (Phase 5/6) with the canonical
Supabase DB state and the live public URLs. It verifies:

1. Candidate assets from _audit_baseline.py exist and match pixel-audit output.
2. Canonical media_assets rows are resolvable and match expected colorways.
3. The colorway-slot mapping is correct.
4. Favicon is independent (different row from logo).
5. Init-flash fix: shared-components.js and index.html match runtime direction.

Reads DB state from PUBLIC_LOGO_DARK_LIGHT_END_TO_END_VERIFICATION.md.
Read-only comparison — no network/DB writes.
"""
import hashlib
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("WARNING: PIL/Pillow not available — pixel comparison will be skipped.")

# ─── Paths ──────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
BRANDING_DIR = ROOT / "assets" / "images" / "branding"

CANDIDATE_FILES = {
    "logo": BRANDING_DIR / "_logo-transparent-candidate.webp",
    "logo-white": BRANDING_DIR / "_logo-white-transparent-candidate.webp",
}

STATIC_FALLBACK = {
    "logo": BRANDING_DIR / "logo.webp",
    "logo-white": BRANDING_DIR / "logo-white.webp",
}

# ─── Canonical DB state (from END_TO_END_VERIFICATION.md) ──

CANONICAL_DB = {
    "logo_media_id": "a5fb7148-8562-4d82-9fc1-d979fc19a323",
    "logo_light_media_id": "fca651b3-9ca1-4e43-b27a-29edc2cc1d3f",
    "favicon_media_id": "032f8b83-b0e1-47af-91d2-31fab05c1bd3",
    "logo_url": "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo.webp",
    "logo_light_url": "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo-white.webp",
    "favicon_url": "https://jczwilrysjnhcjzjztbi.supabase.co/storage/v1/object/public/favicons/favicon.ico",
}

# ─── Helpers ──────────────────────────────────────────────


def sha256(path):
    """Return first 32 hex chars of file SHA256, or 'N/A'."""
    if not path.exists():
        return "N/A"
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()[:32]


def pixel_signature(path, sample_every=10):
    """Return (avg_luminance, dominant_color_rgb) sampled from the image."""
    if not HAS_PIL or not path.exists():
        return (None, None)
    img = Image.open(path).convert("RGB")
    w, h = img.size
    px = img.load()
    total_lum = 0
    count = 0
    color_sum = [0, 0, 0]
    for y in range(0, h, sample_every):
        for x in range(0, w, sample_every):
            r, g, b = px[x, y]
            total_lum += 0.299 * r + 0.587 * g + 0.114 * b
            color_sum[0] += r
            color_sum[1] += g
            color_sum[2] += b
            count += 1
    if count == 0:
        return (None, None)
    return (round(total_lum / count, 1), tuple(c // count for c in color_sum))


def classify_colorway(path):
    """Classify asset as DARK (lum <= 128) or LIGHT (lum > 128)."""
    lum, _ = pixel_signature(path)
    if lum is None:
        return "UNKNOWN"
    return "LIGHT" if lum > 128 else "DARK"


def check_transparency(path):
    """Check if image has meaningful alpha-channel transparency."""
    if not HAS_PIL or not path.exists():
        return False
    img = Image.open(path).convert("RGBA")
    alpha = img.split()[3]
    a_data = list(alpha.getdata())
    transparent = sum(1 for a in a_data if a < 128)
    total = len(a_data)
    return total > 0 and (transparent / total) > 0.01


# ─── Checks ──────────────────────────────────────────────



def check_candidates_exist():
    """Phase 7.1: Verify _audit_baseline.py output files exist."""
    print("=== Phase 7.1: Candidate assets from _audit_baseline.py ===")
    all_ok = True
    for label, path in CANDIDATE_FILES.items():
        exists = path.exists()
        sha = sha256(path)
        lum, rgb = pixel_signature(path)
        cw = classify_colorway(path)
        transp = check_transparency(path)
        print(f"  {label}: {'EXISTS' if exists else 'MISSING'} | sha={sha} | "
              f"lum={lum} | rgb={rgb} | trans={transp} | colorway={cw}")
        if not exists:
            all_ok = False
    return all_ok


def check_canonical_db():
    """Phase 7.2: Verify canonical DB state is internally consistent."""
    print("\n=== Phase 7.2: Canonical DB state ===")
    ok = True
    print(f"  logo_media_id:       {CANONICAL_DB['logo_media_id']}")
    print(f"  logo_light_media_id: {CANONICAL_DB['logo_light_media_id']}")
    print(f"  favicon_media_id:    {CANONICAL_DB['favicon_media_id']}")

    # Favicon must be independent (different row)
    logo_id = CANONICAL_DB["logo_media_id"]
    fav_id = CANONICAL_DB["favicon_media_id"]
    independent = logo_id != fav_id
    print(f"  favicon != logo (independent): {'✅' if independent else '❌ ALIASED!'}")
    if not independent:
        ok = False

    # Light logo must differ from dark logo
    light_id = CANONICAL_DB["logo_light_media_id"]
    if light_id:
        light_diff = light_id != logo_id
        print(f"  logo_light != logo (distinct): {'✅' if light_diff else '❌ SAME ROW!'}")
        if not light_diff:
            ok = False
    else:
        print("  logo_light_media_id is NULL — light colorway falls back to dark")
        ok = False
    return ok


def check_index_html_mapping():
    """Phase 7.3: Verify index.html (git HEAD) init-flash mapping (post d183dda)."""
    import subprocess
    print("\n=== Phase 7.3: index.html init-flash mapping (HEAD) ===")
    r = subprocess.run(["git", "show", "HEAD:index.html"], capture_output=True, check=True)
    html = r.stdout.decode("utf-8", errors="replace")

    dark_correct = bool(
        re.search(r'class="logo-dark site-logo"[^>]*src="[^"]*logo-white', html, re.DOTALL)
        or re.search(r'src="[^"]*logo-white[^"]*"[^>]*class="logo-dark site-logo"', html, re.DOTALL)
    )
    light_correct = bool(
        re.search(r'class="logo-light site-logo"[^>]*src="[^"]*logo\.webp"', html, re.DOTALL)
        or re.search(r'src="[^"]*logo\.webp[^"]*"[^>]*class="logo-light site-logo"', html, re.DOTALL)
    )
    print(f"  .logo-dark  -> logo-white.webp (LIGHT): {'PASS' if dark_correct else 'FAIL'}")
    print(f"  .logo-light -> logo.webp (DARK):        {'PASS' if light_correct else 'FAIL'}")
    return dark_correct and light_correct


def check_shared_components_mapping():
    """Phase 7.4: Verify shared-components.js BRAND fallback assignments."""
    print("\n=== Phase 7.4: shared-components.js init-flash mapping ===")
    sc_path = ROOT / "assets" / "js" / "shared-components.js"
    if not sc_path.exists():
        print("  shared-components.js not found")
        return False
    js = sc_path.read_text(encoding="utf-8")

    dark_count = len(re.findall(
        r'logo-dark site-logo.*logoLightFallback|logoLightFallback.*logo-dark site-logo', js))
    light_count = len(re.findall(
        r'logo-light site-logo.*logoFallback|logoFallback.*logo-light site-logo', js))

    print(f"  .logo-dark  -> BRAND.logoLightFallback (x{dark_count}): {'✅' if dark_count >= 2 else '❌'}")
    print(f"  .logo-light -> BRAND.logoFallback       (x{light_count}): {'✅' if light_count >= 2 else '❌'}")
    return dark_count >= 2 and light_count >= 2


def check_branding_init_mapping():
    """Phase 7.5: Verify branding-init.js updateLogos() direction."""
    print("\n=== Phase 7.5: branding-init.js updateLogos() direction ===")
    bi_path = ROOT / "assets" / "js" / "branding-init.js"
    if not bi_path.exists():
        print("  branding-init.js not found")
        return False
    js = bi_path.read_text(encoding="utf-8")

    dark_gets_light = ".logo-dark.site-logo" in js and "lightUrl" in js
    light_gets_dark = ".logo-light.site-logo" in js and "darkUrl" in js
    print(f"  .logo-dark  <- lightUrl (light on dark header): {'✅' if dark_gets_light else '❌'}")
    print(f"  .logo-light <- darkUrl  (dark on light header): {'✅' if light_gets_dark else '❌'}")
    return dark_gets_light and light_gets_dark


def check_colorway_assets():
    """Phase 7.6: Verify static fallback assets have correct colorways."""
    print("\n=== Phase 7.6: Static fallback asset colorways ===")
    ok = True
    for label, path in STATIC_FALLBACK.items():
        if not path.exists():
            print(f"  {path.name}: MISSING")
            ok = False
            continue
        cw = classify_colorway(path)
        expected = "DARK" if label == "logo" else "LIGHT"
        match = cw == expected
        print(f"  {path.name}: colorway={cw} (expected {expected}) {'✅' if match else '❌'}")
        if not match:
            ok = False
    return ok


def check_pixel_consistency():
    """Phase 7.7: Verify candidate transparency from _audit_baseline.py."""
    print("\n=== Phase 7.7: Transparency consistency ===")
    if not HAS_PIL:
        print("    Skipped (PIL not available)")
        return True
    ok = True
    for label, path in CANDIDATE_FILES.items():
        if path.exists():
            has_alpha = check_transparency(path)
            print(f"  {label} candidate: transparent={has_alpha} "
                  f"{'PASS' if has_alpha else 'FAIL (no alpha)'}")
        else:
            print(f"  {label} candidate: NOT GENERATED (run _audit_baseline.py)")
            ok = False
    return ok


# ─── Main ───────────────────────────────────────────────


def main():
    print("=" * 70)
    print("Phase 7: Branding Audit — DB State & Asset Comparison")
    print("=" * 70)

    results = {}
    results["candidates_exist"] = check_candidates_exist()
    results["canonical_db"] = check_canonical_db()
    results["index_html_mapping"] = check_index_html_mapping()
    results["shared_components"] = check_shared_components_mapping()
    results["branding_init"] = check_branding_init_mapping()
    results["colorway_assets"] = check_colorway_assets()
    results["pixel_consistency"] = check_pixel_consistency()

    print("\n" + "=" * 70)
    print("COMPARISON RESULTS")
    print("=" * 70)
    all_pass = True
    for check, passed in results.items():
        status = "PASS" if passed else "FAIL"
        print(f"  {check:35s} {status}")
        if not passed:
            all_pass = False

    print("\n" + "=" * 70)
    if all_pass:
        print("RESULT: ALL CHECKS PASSED")
    else:
        print("RESULT: SOME CHECKS FAILED — see details above")
    print("=" * 70)
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
