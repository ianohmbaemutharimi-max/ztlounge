"""Phase 5 & 6: Pixel audit and visual QA for transparent logo candidates."""
import hashlib
from PIL import Image, ImageDraw
from collections import Counter


def pixel_audit(path):
    """Phase 5: Full pixel audit of a candidate image."""
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    total = w * h
    a_data = list(img.split()[3].getdata())

    transparent = sum(1 for a in a_data if a < 128)
    opaque = sum(1 for a in a_data if a >= 255)
    partial = total - transparent - opaque

    # Corner pixels
    corners = {}
    for name, (x, y) in [('UL', (5, 5)), ('UR', (w - 6, 5)), ('LL', (5, h - 6)), ('LR', (w - 6, h - 6))]:
        corners[name] = img.getpixel((x, y))

    # Alpha bounding box
    a_chan = img.split()[3]
    a_bbox = a_chan.getbbox()

    # Edge transparency (10px border)
    edge_transparent = 0
    edge_count = 0
    for x in range(w):
        for y in list(range(10)) + list(range(h - 10, h)):
            edge_count += 1
            if a_data[y * w + x] < 128:
                edge_transparent += 1
    for y in range(10, h - 10):
        for x in list(range(10)) + list(range(w - 10, w)):
            edge_count += 1
            if a_data[y * w + x] < 128:
                edge_transparent += 1

    # Dominant colors (sampled)
    sampled = []
    for y in range(0, h, 10):
        for x in range(0, w, 10):
            sampled.append(img.getpixel((x, y)))
    top_colors = Counter(sampled).most_common(5)

    print(f"\n=== PIXEL AUDIT: {path} ===")
    print(f"  SHA256: {hashlib.sha256(open(path, 'rb').read()).hexdigest()[:32]}...")
    print(f"  Dimensions: {w}x{h}")
    print(f"  Mode: RGBA")
    print(f"  Total pixels: {total:,}")
    print(f"  Transparent (alpha<128): {transparent:,} ({100*transparent/total:.1f}%)")
    print(f"  Opaque (alpha>=255): {opaque:,} ({100*opaque/total:.1f}%)")
    print(f"  Partial alpha (128-254): {partial:,} ({100*partial/total:.1f}%)")
    print(f"  Alpha bbox: {a_bbox}")
    if a_bbox:
        bw, bh = a_bbox[2] - a_bbox[0], a_bbox[3] - a_bbox[1]
        print(f"  BBox size: {bw}x{bh} ({100*bw*bh/total:.1f}% of image)")
    print(f"  Corner pixels (5px in):")
    for name, px_val in corners.items():
        print(f"    {name}: RGBA={px_val}")
    print(f"  Edge transparency: {edge_transparent}/{edge_count} ({100*edge_transparent/edge_count:.1f}% transparent)")
    print(f"  Top 5 colors:")
    for c, cnt in top_colors:
        print(f"    RGBA={c}: {cnt} samples ({100*cnt/len(sampled):.1f}%)")

    return img


def visual_qa(img, bg_color, output_path, label):
    """Phase 6: Create visual QA preview."""
    w, h = img.size
    bg = Image.new('RGBA', (w, h), bg_color)
    composite = Image.alpha_composite(bg, img)
    thumb = composite.resize((300, 300), Image.LANCZOS)
    thumb.save(output_path, 'PNG')
    print(f"  Saved: {output_path}")


def visual_qa_checkerboard(img, output_path, tile_size=16):
    w, h = img.size
    bg = Image.new('RGBA', (w, h), (0, 0, 0, 255))
    draw = ImageDraw.Draw(bg)
    light = (180, 180, 180, 255)
    dark = (100, 100, 100, 255)
    for y in range(0, h, tile_size):
        for x in range(0, w, tile_size):
            color = light if (x // tile_size + y // tile_size) % 2 == 0 else dark
            draw.rectangle([x, y, x + tile_size, y + tile_size], fill=color)
    composite = Image.alpha_composite(bg, img)
    thumb = composite.resize((300, 300), Image.LANCZOS)
    thumb.save(output_path, 'PNG')
    print(f"  Saved: {output_path} (checkerboard)")


def main():
    candidates = {
        'logo': 'assets/images/branding/_logo-transparent-candidate.webp',
        'logo-white': 'assets/images/branding/_logo-white-transparent-candidate.webp',
    }

    for label, path in candidates.items():
        img = pixel_audit(path)
        print(f"\n  --- Visual QA: {label} ---")
        visual_qa(img, (255, 255, 255, 255), f'_audit_screenshots/viz_{label}_on_white.png', 'white bg')
        visual_qa(img, (0, 0, 0, 255), f'_audit_screenshots/viz_{label}_on_black.png', 'black bg')
        visual_qa_checkerboard(img, f'_audit_screenshots/viz_{label}_on_checkerboard.png')
    print("\nDone.")


if __name__ == '__main__':
    main()
