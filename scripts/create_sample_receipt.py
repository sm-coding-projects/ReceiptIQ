"""Generate a sample receipt image for testing."""
from PIL import Image, ImageDraw, ImageFont
import os

def create_sample_receipt(output_path="sample_receipts/sample_receipt.png"):
    """Create a simple receipt image for testing OCR."""
    width, height = 400, 600
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 16)
        font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 20)
    except (OSError, IOError):
        font = ImageFont.load_default()
        font_bold = font

    lines = [
        ("SUPER MARKET", font_bold, 20),
        ("123 Main Street", font, 50),
        ("Springfield, IL 62704", font, 70),
        ("", font, 90),
        ("Receipt #: 00012345", font, 110),
        ("Date: 01/15/2024  14:30", font, 130),
        ("", font, 150),
        ("--------------------------------", font, 160),
        ("MILK 2%           1   $3.99", font, 180),
        ("WHEAT BREAD       1   $2.49", font, 200),
        ("EGGS LARGE        1   $4.99", font, 220),
        ("ORANGE JUICE      1   $3.49", font, 240),
        ("BANANAS           1   $1.29", font, 260),
        ("CHICKEN BREAST    1   $8.99", font, 280),
        ("--------------------------------", font, 300),
        ("SUBTOTAL              $25.24", font, 320),
        ("TAX (8.25%)            $2.08", font, 340),
        ("TOTAL                 $27.32", font, 370),
        ("", font, 390),
        ("VISA ****4582", font, 410),
        ("AUTH: 123456", font, 430),
        ("", font, 450),
        ("THANK YOU FOR SHOPPING!", font, 480),
    ]

    for text, f, y in lines:
        if text:
            x = 20
            draw.text((x, y), text, fill='black', font=f)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"Sample receipt saved to {output_path}")
    return output_path

if __name__ == "__main__":
    create_sample_receipt()
