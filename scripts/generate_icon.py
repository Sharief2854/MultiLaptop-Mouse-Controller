import math
from PIL import Image, ImageDraw, ImageFilter

def create_app_icon(size=512):
    # Create high-res canvas with RGBA
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Base App Tile: Rounded rectangle with gradient & glow
    padding = 24
    radius = 96
    tile_rect = [padding, padding, size - padding, size - padding]

    # Draw soft outer shadow
    shadow_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_img)
    shadow_draw.rounded_rectangle(
        [padding + 4, padding + 12, size - padding - 4, size - padding + 12],
        radius=radius,
        fill=(0, 0, 0, 140)
    )
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(16))
    img.paste(shadow_img, (0, 0), shadow_img)

    # Gradient background for main tile (Dark slate to deep navy)
    gradient = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(gradient)
    for y in range(padding, size - padding):
        ratio = (y - padding) / (size - 2 * padding)
        # From #0f172a (15, 23, 42) to #1e293b (30, 41, 59) with slight blue tint
        r = int(15 + ratio * 20)
        g = int(23 + ratio * 35)
        b = int(42 + ratio * 60)
        grad_draw.line([(padding, y), (size - padding, y)], fill=(r, g, b, 255))

    # Mask tile with rounded rectangle
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(tile_rect, radius=radius, fill=255)
    img.paste(gradient, (0, 0), mask)

    # Outer border stroke (Cyan-to-blue glow border)
    border_draw = ImageDraw.Draw(img)
    border_draw.rounded_rectangle(tile_rect, radius=radius, outline=(56, 189, 248, 180), width=4)

    # 2. Draw Laptop 1 (Top Laptop)
    top_x = 110
    top_y = 70
    lap_w = 292
    lap_h = 160
    
    # Laptop 1 Screen Bezel
    border_draw.rounded_rectangle(
        [top_x, top_y, top_x + lap_w, top_y + lap_h],
        radius=14,
        fill=(15, 23, 42, 255),
        outline=(148, 163, 184, 220),
        width=4
    )
    # Laptop 1 Inner Display (Glowing Cyan)
    disp_pad = 12
    disp_rect_top = [top_x + disp_pad, top_y + disp_pad, top_x + lap_w - disp_pad, top_y + lap_h - disp_pad]
    border_draw.rounded_rectangle(
        disp_rect_top,
        radius=8,
        fill=(14, 116, 144, 255),
        outline=(56, 189, 248, 255),
        width=2
    )
    # Screen decorative grid bars
    for row in range(3):
        gy = disp_rect_top[1] + 20 + row * 26
        border_draw.line(
            [(disp_rect_top[0] + 16, gy), (disp_rect_top[2] - 16, gy)],
            fill=(56, 189, 248, 90),
            width=2
        )
    # Laptop 1 Base / Keyboard deck
    base_y = top_y + lap_h
    border_draw.polygon(
        [
            (top_x - 16, base_y + 12),
            (top_x + lap_w + 16, base_y + 12),
            (top_x + lap_w + 6, base_y),
            (top_x - 6, base_y)
        ],
        fill=(51, 65, 85, 255),
        outline=(100, 116, 139, 200)
    )
    # Trackpad notch
    notch_w = 48
    border_draw.line(
        [(size // 2 - notch_w // 2, base_y + 2), (size // 2 + notch_w // 2, base_y + 2)],
        fill=(148, 163, 184, 255),
        width=2
    )

    # 3. Draw Laptop 2 (Bottom Laptop)
    bot_x = 110
    bot_y = 295
    
    # Laptop 2 Screen Bezel
    border_draw.rounded_rectangle(
        [bot_x, bot_y, bot_x + lap_w, bot_y + lap_h],
        radius=14,
        fill=(15, 23, 42, 255),
        outline=(148, 163, 184, 220),
        width=4
    )
    # Laptop 2 Inner Display (Glowing Indigo / Cyan)
    disp_rect_bot = [bot_x + disp_pad, bot_y + disp_pad, bot_x + lap_w - disp_pad, bot_y + lap_h - disp_pad]
    border_draw.rounded_rectangle(
        disp_rect_bot,
        radius=8,
        fill=(30, 58, 138, 255),
        outline=(96, 165, 250, 255),
        width=2
    )
    # Screen decorative grid bars
    for row in range(3):
        gy = disp_rect_bot[1] + 20 + row * 26
        border_draw.line(
            [(disp_rect_bot[0] + 16, gy), (disp_rect_bot[2] - 16, gy)],
            fill=(96, 165, 250, 90),
            width=2
        )
    # Laptop 2 Base / Keyboard deck
    base2_y = bot_y + lap_h
    border_draw.polygon(
        [
            (bot_x - 16, base2_y + 12),
            (bot_x + lap_w + 16, base2_y + 12),
            (bot_x + lap_w + 6, base2_y),
            (bot_x - 6, base2_y)
        ],
        fill=(51, 65, 85, 255),
        outline=(100, 116, 139, 200)
    )
    border_draw.line(
        [(size // 2 - notch_w // 2, base2_y + 2), (size // 2 + notch_w // 2, base2_y + 2)],
        fill=(148, 163, 184, 255),
        width=2
    )

    # 4. Central Mouse Cursor & Directional Flow Pulse
    center_y = 265
    center_x = size // 2

    # Draw vertical pulse flow line between laptops
    flow_draw = ImageDraw.Draw(img)
    flow_draw.line([(center_x, top_y + lap_h + 16), (center_x, bot_y - 8)], fill=(16, 185, 129, 230), width=4)

    # Up/Down arrow heads
    # Down arrow (Laptop 1 -> Laptop 2)
    flow_draw.polygon(
        [(center_x - 14, bot_y - 12), (center_x + 14, bot_y - 12), (center_x, bot_y - 2)],
        fill=(16, 185, 129, 255)
    )
    # Up arrow (Laptop 2 -> Laptop 1)
    flow_draw.polygon(
        [(center_x - 14, top_y + lap_h + 16), (center_x + 14, top_y + lap_h + 16), (center_x, top_y + lap_h + 6)],
        fill=(56, 189, 248, 255)
    )

    # Mouse pointer badge in center
    badge_r = 34
    badge_center = (center_x + 40, center_y)
    flow_draw.ellipse(
        [badge_center[0] - badge_r, badge_center[1] - badge_r, badge_center[0] + badge_r, badge_center[1] + badge_r],
        fill=(15, 23, 42, 240),
        outline=(56, 189, 248, 255),
        width=3
    )

    # Mouse pointer cursor arrow inside badge
    mx = badge_center[0] - 12
    my = badge_center[1] - 14
    cursor_pts = [
        (mx, my),
        (mx, my + 26),
        (mx + 7, my + 20),
        (mx + 13, my + 30),
        (mx + 18, my + 27),
        (mx + 12, my + 17),
        (mx + 21, my + 17)
    ]
    flow_draw.polygon(cursor_pts, fill=(255, 255, 255, 255), outline=(15, 23, 42, 255))

    return img

if __name__ == '__main__':
    icon = create_app_icon(512)
    
    # Save high-res PNG
    png_path = "d:/sharief/mouse/resources/icon.png"
    icon.save(png_path, format="PNG")
    print(f"Saved {png_path}")

    # Generate multi-size ICO
    ico_path = "d:/sharief/mouse/resources/icon.ico"
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    icon.save(ico_path, format="ICO", sizes=sizes)
    print(f"Saved {ico_path} with sizes: {sizes}")
