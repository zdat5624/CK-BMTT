import cv2
import numpy as np
import matplotlib.pyplot as plt
import os

ALPHA = 0.1

# =======================
# 1️⃣  NHÚNG WATERMARK
# =======================
def embed_watermark_color(cover_color, watermark, alpha=ALPHA):
    # Chuyển sang YCrCb để nhúng watermark vào kênh Y
    ycrcb = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)
    y, cr, cb = cv2.split(ycrcb)

    # DCT
    y_f = np.float32(y)
    dct_y = cv2.dct(y_f)

    # Xác định vùng giữa để nhúng
    r, c = y.shape
    r1, c1 = r // 4, c // 4
    region = dct_y[r1:r1*3, c1:c1*3]

    # Resize watermark theo kích thước vùng giữa
    wm_h, wm_w = region.shape
    watermark_resized = cv2.resize(watermark, (wm_w, wm_h))

    # Nhúng watermark
    region_wm = region + alpha * np.float32(watermark_resized)
    dct_y[r1:r1*3, c1:c1*3] = region_wm

    # IDCT để khôi phục kênh Y có watermark
    y_wm = cv2.idct(dct_y)
    y_wm = np.uint8(np.clip(y_wm, 0, 255))

    # Ghép lại ảnh màu
    ycrcb_wm = cv2.merge((y_wm, cr, cb))
    watermarked_color = cv2.cvtColor(ycrcb_wm, cv2.COLOR_YCrCb2BGR)

    return watermarked_color, dct_y



# =======================
# 2️⃣  TÁCH WATERMARK
# =======================
def extract_watermark_color(cover_color, watermarked_color, alpha=ALPHA):
    cover_y = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)[:, :, 0]
    wm_y = cv2.cvtColor(watermarked_color, cv2.COLOR_BGR2YCrCb)[:, :, 0]

    dct_cover = cv2.dct(np.float32(cover_y))
    dct_watermarked = cv2.dct(np.float32(wm_y))

    r, c = cover_y.shape
    r1, c1 = r // 4, c // 4
    region_cover = dct_cover[r1:r1*3, c1:c1*3]
    region_watermarked = dct_watermarked[r1:r1*3, c1:c1*3]

    region_diff = (region_watermarked - region_cover) / alpha

    wm_extracted = np.uint8(np.clip(region_diff, 0, 255))
    wm_extracted = cv2.resize(wm_extracted, (128, 128))
    return wm_extracted


# =======================
# 3️⃣  HÀM ĐÁNH GIÁ
# =======================

def correlation(img1, img2):
    img1_f = img1.flatten().astype(np.float32)
    img2_f = img2.flatten().astype(np.float32)
    if np.std(img1_f) == 0 or np.std(img2_f) == 0:
        return 0 
    return np.corrcoef(img1_f, img2_f)[0, 1]


def ncc(img1, img2):
    img1 = img1.astype(np.float32)
    img2 = img2.astype(np.float32)
    mean1, mean2 = np.mean(img1), np.mean(img2)
    numerator = np.sum((img1 - mean1) * (img2 - mean2))
    denominator = np.sqrt(np.sum((img1 - mean1)**2) * np.sum((img2 - mean2)**2))
    if denominator == 0:
        return 0
    return numerator / denominator

# =======================
# 4️⃣  CHẠY DEMO
# =======================
if __name__ == "__main__":
    input_dir = "input"
    output_dir = "output1"
    os.makedirs(output_dir, exist_ok=True)

    #  Đọc tên file ảnh
    cover_name = "iceberg-9729318_1920.jpg"
    watermark_name = "watermark.png"

    cover_path = os.path.join(input_dir, cover_name)
    watermark_path = os.path.join(input_dir, watermark_name)

    #  Đọc ảnh
    cover_color = cv2.imread(cover_path)
    watermark = cv2.imread(watermark_path, cv2.IMREAD_GRAYSCALE)

    if cover_color is None or watermark is None:
        print(" Không tìm thấy ảnh trong thư mục input/")
        exit()

    #  Nhúng watermark
    watermarked_color = cv2.imread("./input/watermarked_color.png")
    # watermarked_color, _ = embed_watermark_color(cover_color, watermark)

    #  Tách watermark
    extracted = extract_watermark_color(cover_color, watermarked_color)

    #  Lưu kết quả
    cv2.imwrite(os.path.join(output_dir, "cover_color.png"), cover_color)
    cv2.imwrite(os.path.join(output_dir, "watermarked_color.png"), watermarked_color)
    cv2.imwrite(os.path.join(output_dir, "extracted.png"), extracted)

    print(" Ảnh đã lưu trong thư mục ./output1/")
    print(f"Tương quan watermark: {correlation(watermark, extracted):.4f}")
    print(f"ncc: {ncc(watermark, extracted):.4f}")


    #  Hiển thị kết quả
    plt.figure(figsize=(12, 6))
    plt.subplot(1, 4, 1)
    plt.imshow(cv2.cvtColor(cover_color, cv2.COLOR_BGR2RGB))
    plt.title("Ảnh gốc")

    plt.subplot(1, 4, 2)
    plt.imshow(cv2.cvtColor(watermarked_color, cv2.COLOR_BGR2RGB))
    plt.title("Ảnh có watermark")

    plt.subplot(1, 4, 3)
    plt.imshow(watermark, cmap='gray')
    plt.title("Watermark ")

    plt.subplot(1, 4, 4)
    plt.imshow(extracted, cmap='gray')
    plt.title("Watermark trích xuất")

    plt.show()
