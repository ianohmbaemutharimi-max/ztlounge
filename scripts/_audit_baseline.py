"""
Phase 2/3/4: Extract transparent logo assets from the original images.

Extraction method:
- logo-white.webp: Uniform white background -> color-distance-based alpha mask
- logo.webp: Dark gradient background -> reuse alpha mask from logo-white.webp (shared geometry)

The two images share the same logo shape. logo-white.webp has a uniform white
background which produces a clean alpha mask. This mask is applied to both images
for consistent edges and shape preservation.
"""
import hashlib
import math
from PIL import Image, ImageFilter


def distance_from_color(r, g, b, cr, cg, cb):
    """Euclidean distance in RGB space."""
    return math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2)


def create_alpha_mask_from_white_bg(img_rgb):
    """
    Create alpha mask from an image with a white background.

    White (255,255,255) -> alpha 0 (transparent)
    Black (0,0,0)        -> alpha 255 (opaque)
    Anti-aliased pixels  -> proportional alpha based on color distance

    The alpha is proportional to the Euclidean distance from white.
    Max distance: sqrt(3 * 255^2) = ~441.67
    This gives smooth anti-aliasing: a 50% blend pixel gets ~50% alpha.
    """
    w, h = img_rgb.size
    mask = Image.new('L', (w, h), 0)
    mask_px = mask.load()
    src_px = img_rgb.load()

    max_dist = math.sqrt(3 * 255 ** 2)  # ~441.67

    for y in range(h):
        for x in range(w):
            r, g, b = src_px[x, y]
            dist = distance_from_color(r, g, b, 255, 255, 255)
            alpha = min(255, int(dist / max_dist * 255))
            mask_px[x, y] = alpha

    return mask


def main():
    # Step 1: Load source images
    src_white = Image.open('assets/images/branding/logo-white.webp').convert('RGB')
    src_dark = Image.open('assets/images/branding/logo.webp').convert('RGB')

    print("=== Phase 2: Source Artwork Inspection ===")
    print(f"logo-white.webp: {src_white.size}, uniform white bg, dark logo + gold accent")
    print(f"logo.webp: {src_dark.size}, gradient dark bg, bright logo elements + gold accent")
    print()

    # Step 2: Create alpha mask from logo-white.webp (distance from white)
    print("=== Phase 3: Extraction Method ===")
    print("Method: Color-distance-based alpha from white background")
    print("logo-white.webp -> alpha mask based on RGB distance from (255,255,255)")
    print("logo.webp -> reuse same alpha mask (shared logo geometry)")
    print()

    alpha_mask = create_alpha_mask_from_white_bg(src_white)

    # Step 3: Create candidates
    print("=== Phase 4: Creating candidate assets ===")

    # logo-white.webp candidate: dark logo on transparent
    img_white_result = src_white.convert('RGBA')
    img_white_result.putalpha(alpha_mask)

    # logo.webp candidate: use SAME alpha mask (shared geometry)
    img_dark_result = src_dark.convert('RGBA')
    img_dark_result.putalpha(alpha_mask)

    # Save candidates as WebP (alpha-capable encoding)
    white_path = 'assets/images/branding/_logo-white-transparent-candidate.webp'
    dark_path = 'assets/images/branding/_logo-transparent-candidate.webp'

    img_white_result.save(white_path, 'WEBP', quality=95, method=6)
    img_dark_result.save(dark_path, 'WEBP', quality=95, method=6)

    print(f"  Saved: {dark_path}")
    print(f"  Saved: {white_path}")

    # Quick verification
    for path in [dark_path, white_path]:
        img = Image.open(path)
        print(f"\n  {path}:")
        print(f"    Mode: {img.mode}, Size: {img.size}")
        if img.mode == 'RGBA':
            w, h = img.size
            print(f"    Corner alpha: UL={img.getpixel((5,5))[3]}, UR={img.getpixel((w-6,5))[3]}, "
                  f"LL={img.getpixel((5,h-6))[3]}, LR={img.getpixel((w-6,h-6))[3]}")

    print("\nDone.")


if __name__ == '__main__':
    main()

