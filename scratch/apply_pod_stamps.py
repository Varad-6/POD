import os
import glob
from PIL import Image, ImageDraw, ImageFont

def draw_centered_text(draw, text, xy, fill, font):
    try:
        if hasattr(draw, "textbbox"):
            bbox = draw.textbbox((0, 0), text, font=font)
            w = bbox[2] - bbox[0]
            h = bbox[3] - bbox[1]
        else:
            w, h = draw.textsize(text, font=font)
    except:
        w = len(text) * 8
        h = 16
    
    x = xy[0] - w // 2
    y = xy[1] - h // 2
    draw.text((x, y), text, fill=fill, font=font)

def draw_stamp(image_path):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    # Create transparent stamp canvas
    stamp_size = 180
    stamp = Image.new("RGBA", (stamp_size, stamp_size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(stamp)
    
    # Green color
    green = (4, 120, 87, 255)
    
    # Draw double circle
    draw.ellipse([10, 10, stamp_size - 10, stamp_size - 10], outline=green, width=4)
    draw.ellipse([16, 16, stamp_size - 16, stamp_size - 16], outline=green, width=1)
    
    # Font setup
    try:
        font_main = ImageFont.truetype("arial.ttf", 22)
        font_sub = ImageFont.truetype("arial.ttf", 12)
    except:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    # Draw texts
    draw_centered_text(draw, "IKWEZI", (stamp_size // 2, 45), green, font_main)
    draw_centered_text(draw, "VERIFIED", (stamp_size // 2, 90), green, font_main)
    draw_centered_text(draw, "GATE-PASS", (stamp_size // 2, 135), green, font_sub)
    
    # Rotate stamp (positive rotates counter-clockwise, let's rotate 15 deg)
    rotated = stamp.rotate(15, resample=Image.BICUBIC, expand=True)
    
    # Paste stamp onto image at bottom right
    r_width, r_height = rotated.size
    paste_x = width - r_width - 24
    paste_y = height - r_height - 24
    
    # Paste with transparency alpha mask
    img.paste(rotated, (paste_x, paste_y), rotated)
    img.convert("RGB").save(image_path, "JPEG", quality=95)
    print(f"Stamped: {os.path.basename(image_path)}")

def main():
    target_dir = r"C:\Users\Varad\Desktop\POD\public\demo-files"
    search_path = os.path.join(target_dir, "WB-*.jpg")
    files = glob.glob(search_path)
    print(f"Found {len(files)} files to stamp.")
    for f in files:
        try:
            draw_stamp(f)
        except Exception as e:
            print(f"Error stamping {os.path.basename(f)}: {e}")
    print("Stamping completed successfully!")

if __name__ == "__main__":
    main()
