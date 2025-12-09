import cv2
import numpy as np
import pywt

def dct2(block):
    return cv2.dct(block)

def extract_dwt_dct_svd(cover_color, wm_color, meta, alpha=0.44):
    wavelet = meta['wavelet']
    Uw = meta['Uw'] # Đây là ma trận đã cắt gọn (N x k)
    Vw = meta['Vw'] # Đây là ma trận đã cắt gọn (k x N)

    # Resize nếu hình không bằng nhau
    if cover_color.shape != wm_color.shape:
        wm_color = cv2.resize(
            wm_color,
            (cover_color.shape[1], cover_color.shape[0])
        )

    # BGR -> Y kênh
    cover_y = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)[:, :, 0].astype(np.float32)
    wm_y = cv2.cvtColor(wm_color, cv2.COLOR_BGR2YCrCb)[:, :, 0].astype(np.float32)

    # DWT
    LL_c, _ = pywt.dwt2(cover_y, wavelet)
    LL_m, _ = pywt.dwt2(wm_y, wavelet)

    # DCT
    dct_LL_c = dct2(LL_c)
    dct_LL_m = dct2(LL_m)

    # SVD
    Sc_c = np.linalg.svd(dct_LL_c, full_matrices=False)[1]
    Sc_m = np.linalg.svd(dct_LL_m, full_matrices=False)[1]

    # Vì Uw trong meta đã được cắt sẵn theo k (ví dụ k=30), ta lấy k từ shape của Uw
    k = Uw.shape[1]

    # Đảm bảo không vượt quá kích thước thực tế (phòng trường hợp ảnh quá nhỏ)
    k = min(k, len(Sc_c), len(Sc_m))

    # Khôi phục singular values watermark
    Sw_rec = (Sc_m[:k] - Sc_c[:k]) / alpha

    # Tái tạo watermark: Uw(Nxk) * diag(kxk) * Vw(kxN) -> Kết quả (NxN)
    wm_rec = Uw[:, :k] @ np.diag(Sw_rec) @ Vw[:k, :]

    # Chuẩn hóa về 0–255
    wm_rec -= wm_rec.min()
    if wm_rec.max() > 0:
        wm_rec = wm_rec / wm_rec.max()

    wm_out = np.uint8(np.clip(wm_rec * 255, 0, 255))

    # Resize về shape gốc
    wm_out = cv2.resize(
        wm_out,
        meta['original_wm_shape'][::-1]
    )

    return wm_out

#  hàm tính NC
def nc(original, extract):
    # Resize
    if original.shape != extract.shape:
        extract = cv2.resize(extract, (original.shape[1], original.shape[0]))

    a = original.flatten().astype(float)
    b = extract.flatten().astype(float)

    a = a - np.mean(a)
    b = b - np.mean(b)

    return np.dot(a, b) / np.sqrt(np.dot(a, a) * np.dot(b, b) + 1e-9)



def check_main(uploaded_img, cover_img, meta, wm_original):
    try:
        # --- 1. KIỂM TRA SƠ BỘ ---
        h, w = cover_img.shape[:2]
        uploaded_resized = cv2.resize(uploaded_img, (w, h))
        correlation = nc(cover_img, uploaded_resized)

        if correlation < 0.55:
            # print("The uploaded photo is not the same as the original photo.")
            return {
                "score": 0.0,
                "detected": False,
                "reason": "Image mismatch (Wrong image)"
            }

        # --- 2. TRÍCH XUẤT  ---
        extracted = extract_dwt_dct_svd(cover_img, uploaded_img, meta)
        score = nc(wm_original, extracted)
        detected = float(score) > 0.85

        return {
            "score": float(score),
            "detected": bool(detected),
            "reason": "Success"
        }

    except Exception as e:
        # --- KHI CÓ LỖI (CRASH) ---
        # print("Check algorithm error:", str(e))

        return {
            "score": 0.0,
            "detected": False,
            "reason": f"System Error: {str(e)}"
        }