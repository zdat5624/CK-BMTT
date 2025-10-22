import cv2
import numpy as np
import matplotlib.pyplot as plt
import os

# =======================
# 1️⃣  TẠO ẢNH MẪU
# =======================
def generate_images():
    cover = np.zeros((256, 256), dtype=np.uint8)
    cv2.putText(cover, "AI", (80, 140), cv2.FONT_HERSHEY_SIMPLEX, 3, 255, 8)

    wm = np.zeros((64, 64), dtype=np.uint8)
    cv2.putText(wm, "WM", (5, 45), cv2.FONT_HERSHEY_SIMPLEX, 1.5, 255, 4)
    return cover, wm


# =======================
# 2️⃣  DCT + NHÚNG WATERMARK
# =======================
def embed_watermark(cover, watermark, alpha=0.05):
    cover_f = np.float32(cover)
    watermark_resized = cv2.resize(watermark, (cover.shape[1] // 2, cover.shape[0] // 2))

    # DCT của ảnh cover
    dct_cover = cv2.dct(cover_f)

    # Nhúng watermark vào vùng tần số giữa
    r, c = cover.shape
    r1, c1 = r // 4, c // 4
    region = dct_cover[r1:r1*3, c1:c1*3]
    wm_f = np.float32(watermark_resized)
    region_wm = region + alpha * wm_f

    dct_cover[r1:r1*3, c1:c1*3] = region_wm

    # IDCT để tạo ảnh có watermark
    watermarked = cv2.idct(dct_cover)
    watermarked = np.uint8(np.clip(watermarked, 0, 255))

    return watermarked, dct_cover, wm_f


# =======================
# 3️⃣  TÁCH WATERMARK
# =======================
def extract_watermark(cover, watermarked, alpha=0.05):
    dct_cover = cv2.dct(np.float32(cover))
    dct_watermarked = cv2.dct(np.float32(watermarked))

    r, c = cover.shape
    r1, c1 = r // 4, c // 4
    region_diff = (dct_watermarked[r1:r1*3, c1:c1*3] - dct_cover[r1:r1*3, c1:c1*3]) / alpha
    wm_extracted = np.uint8(np.clip(region_diff, 0, 255))
    wm_extracted = cv2.resize(wm_extracted, (64, 64))
    return wm_extracted


# =======================
# 4️⃣  ĐÁNH GIÁ & HIỂN THỊ
# =======================
def psnr(img1, img2):
    mse = np.mean((img1 - img2) ** 2)
    if mse == 0:
        return 100
    PIXEL_MAX = 255.0
    return 20 * np.log10(PIXEL_MAX / np.sqrt(mse))


def correlation(img1, img2):
    img1_f = img1.flatten().astype(np.float32)
    img2_f = img2.flatten().astype(np.float32)
    corr = np.corrcoef(img1_f, img2_f)[0, 1]
    return corr


# =======================
# 5️⃣  CHẠY DEMO
# =======================
if __name__ == "__main__":
    # Tạo thư mục output nếu chưa có
    os.makedirs("output", exist_ok=True)

    cover, watermark = generate_images()
    watermarked, dct_cover, wm_f = embed_watermark(cover, watermark)
    extracted = extract_watermark(cover, watermarked)

    # Lưu các ảnh output
    cv2.imwrite("output/cover.png", cover)
    cv2.imwrite("output/watermark.png", watermark)
    cv2.imwrite("output/watermarked.png", watermarked)
    cv2.imwrite("output/extracted.png", extracted)

    print(f"✅ Ảnh đã lưu vào thư mục ./output/")
    print(f"PSNR giữa ảnh gốc và ảnh có watermark: {psnr(cover, watermarked):.2f} dB")
    print(f"Tương quan giữa watermark gốc và trích xuất: {correlation(watermark, extracted):.4f}")

    # Hiển thị kết quả
    plt.figure(figsize=(10, 5))
    plt.subplot(1, 3, 1)
    plt.imshow(cover, cmap='gray')
    plt.title("Ảnh gốc")

    plt.subplot(1, 3, 2)
    plt.imshow(watermarked, cmap='gray')
    plt.title("Ảnh có watermark")

    plt.subplot(1, 3, 3)
    plt.imshow(extracted, cmap='gray')
    plt.title("Watermark trích xuất")

    plt.show()
