"""READ-ONLY AUDIT: Generate visualization renders of logo assets."""
from PIL import Image, ImageDraw
import os

os.makedirs('_audit_screenshots', exist_ok=True)

DARK_HEADER_BG = (10, 10, 10, 255)   # rgba(10,10,10,0.92) from CSS
LIGHT_HEADER_BG = (255, 255, 255, 255)  # white header

logos = [
    ('logo.webp', 'DARK colorway (logo.webp) - shown on WHITE header in light mode'),
    ('logo-white.webp', 'LIGHT colorway (logo-white.webp) - shown on DARK header in dark mode'),
    ('logo-opt.webp', 'DARK colorway OPT (logo-opt.webp)'),
    ('logo-white-opt.webp', 'LIGHT colorway OPT (logo-white-opt.webp)'),
]

for logo_name, desc in logos:
    path = f'assets/images/branding/{logo_name}'
    if not os.path.exists(path):
        print(f'{logo_name}: NOT FOUND')
        continue

    img = Image.open(path).convert('RGBA')
    w, h = img.size
    stem = logo_name.replace('.webp', '')
    has_alpha = 'A' in img.getbands()

    # 1. On WHITE background (light header simulation)
    white_bg = Image.new('RGBA', img.size, LIGHT_HEADER_BG)
    white_comp = Image.alpha_composite(white_bg, img)
    white_path = f'_audit_screenshots/viz_{stem}_on_white.png'
    white_comp.save(white_path)

    # 2. On BLACK background (dark header simulation)
    black_bg = Image.new('RGBA', img.size, DARK_HEADER_BG)
    black_comp = Image.alpha_composite(black_bg, img)
    black_path = f'_audit_screenshots/viz_{stem}_on_black.png'
    black_comp.save(black_path)

    # 3. On CHECKERBOARD (transparency indicator)
    checker = Image.new('RGBA', img.size, (0, 0, 0, 255))
    draw = ImageDraw.Draw(checker)
    tile = 20
    for y in range(0, h, tile):
        for x in range(0, w, tile):
            color = (200, 200, 200, 255) if (x // tile + y // tile) % 2 == 0 else (150, 150, 150, 255)
            draw.rectangle([x, y, x + tile, y + tile], fill=color)
    checker_comp = Image.alpha_composite(checker, img)
    checker_path = f'_audit_screenshots/viz_{stem}_on_checkerboard.png'
    checker_comp.save(checker_path)

    # Pixel stats
    pixels = list(img.getdata())
    total = len(pixels)
    transparent = sum(1 for p in pixels if p[3] < 128)
    near_black = sum(1 for p in pixels if max(p[0], p[1], p[2]) < 50)
    near_white = sum(1 for p in pixels if min(p[0], p[1], p[2]) > 205)
    all_corners = [img.getpixel((0, 0)), img.getpixel((w-1, 0)), img.getpixel((0, h-1)), img.getpixel((w-1, h-1))]

    print(f'{desc}')
    print(f'  Mode: {img.mode}, Has alpha: {has_alpha}')
    print(f'  Transparent: {100*transparent/total:.1f}%')
    print(f'  Near-black: {100*near_black/total:.1f}%')
    print(f'  Near-white: {100*near_white/total:.1f}%')
    print(f'  Corners: {all_corners}')
    print(f'  Visualizations saved: {white_path}, {black_path}, {checker_path}')
    print()
