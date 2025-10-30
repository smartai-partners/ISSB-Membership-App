from PIL import Image
import os

# Optimize mosque images
image_files = [
    '/workspace/issb-portal/public/images/mosque-exterior.jpg',
    '/workspace/issb-portal/public/images/mosque-courtyard.jpg'
]

for img_path in image_files:
    if os.path.exists(img_path):
        img = Image.open(img_path)
        
        # Get original size
        orig_size = os.path.getsize(img_path) / (1024 * 1024)  # MB
        print(f"\nOptimizing: {os.path.basename(img_path)}")
        print(f"Original size: {orig_size:.2f} MB")
        print(f"Original dimensions: {img.size}")
        
        # Resize to reasonable web dimensions (max 1920px width)
        max_width = 1920
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            print(f"Resized to: {img.size}")
        
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Save with optimization
        optimized_path = img_path.replace('.jpg', '-optimized.jpg')
        img.save(optimized_path, 'JPEG', quality=85, optimize=True)
        
        # Get optimized size
        opt_size = os.path.getsize(optimized_path) / (1024 * 1024)  # MB
        print(f"Optimized size: {opt_size:.2f} MB")
        print(f"Reduction: {((orig_size - opt_size) / orig_size * 100):.1f}%")
        
        # Replace original with optimized
        os.rename(optimized_path, img_path)
        print(f"Replaced original with optimized version")
    else:
        print(f"File not found: {img_path}")

print("\n✓ Image optimization complete!")
