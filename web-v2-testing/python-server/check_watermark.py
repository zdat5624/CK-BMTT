import cv2
import numpy as np
import pywt

def dct2(block):
    return cv2.dct(block)

def idct2(block):
    return cv2.idct(block)

def extract_dwt_dct_additive(cover_color, wm_color, meta):
    wavelet = meta.get('wavelet', 'haar')
    alpha = meta.get('alpha', 5.0)

    if cover_color.shape != wm_color.shape:
        wm_color = cv2.resize(wm_color, (cover_color.shape[1], cover_color.shape[0]))

    # 1. Xử lý ảnh GỐC
    cover_y = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)[:, :, 0].astype(np.float32)
    LL_c, _ = pywt.dwt2(cover_y, wavelet)
    dct_LL_c = dct2(LL_c)

    # 2. Xử lý ảnh UPLOAD
    wm_y = cv2.cvtColor(wm_color, cv2.COLOR_BGR2YCrCb)[:, :, 0].astype(np.float32)
    LL_m, _ = pywt.dwt2(wm_y, wavelet)
    dct_LL_m = dct2(LL_m)

    # --- FIX LỖI: Trừ trong miền tần số rồi mới IDCT ---
    h, w = dct_LL_c.shape
    dct_LL_m = cv2.resize(dct_LL_m, (w, h))

    # DCT_diff = (DCT_upload - DCT_cover) / alpha
    dct_diff = dct_LL_m - dct_LL_c
    dct_extracted = dct_diff / alpha

    # Chuyển ngược từ DCT về Pixel (IDCT)
    extracted_raw = idct2(dct_extracted)

    # Chuẩn hóa
    extracted_raw -= extracted_raw.min()
    if extracted_raw.max() > 0:
        extracted_raw = extracted_raw / extracted_raw.max()
    
    wm_out = np.uint8(np.clip(extracted_raw * 255, 0, 255))

    original_shape = meta.get('original_wm_shape', (128, 128))
    wm_out = cv2.resize(wm_out, original_shape[::-1])

    return wm_out

# ... (Giữ nguyên các hàm nc và check_main cũ) ...
# Lưu ý: Trong hàm check_main, bạn cần sửa điều kiện gọi hàm extract nếu đổi tên key thuật toán
# if meta.get('algorithm') == 'DCT_ADDITIVE_V2': ...

def nc(original, extract):
    # Resize
    if original.shape != extract.shape:
        extract = cv2.resize(extract, (original.shape[1], original.shape[0]))

    a = original.flatten().astype(float)
    b = extract.flatten().astype(float)

    # Centering (Quan trọng để loại bỏ độ sáng nền)
    a -= np.mean(a)
    b -= np.mean(b)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0: return 0
    return np.dot(a, b) / (norm_a * norm_b)

# --- GIỮ NGUYÊN SIGNATURE CHO SERVER GỌI ---
def check_main(uploaded_img, cover_img, meta, wm_original):
    try:
        # --- 1. PRE-CHECK: SO SÁNH CẤU TRÚC ẢNH (DÙNG ẢNH XÁM) ---
        # Chuyển sang Gray để so sánh cấu trúc, bỏ qua sai lệch màu sắc do filter
        cover_gray = cv2.cvtColor(cover_img, cv2.COLOR_BGR2GRAY)

        h, w = cover_gray.shape
        uploaded_resized = cv2.resize(uploaded_img, (w, h))
        uploaded_gray = cv2.cvtColor(uploaded_resized, cv2.COLOR_BGR2GRAY)

        correlation = nc(cover_gray, uploaded_gray)
        # print(f"Pre-check Correlation (Gray): {correlation}")

        if correlation < 0.5:
            print("Ảnh upload quá khác biệt so với ảnh gốc.")
            return {
                "score": 0.0,
                "detected": False,
                "reason": "Image mismatch (Wrong image)"
            }

        # --- 2. TRÍCH XUẤT WATERMARK ---
        # Kiểm tra xem metadata có phải của thuật toán mới không
        if meta.get('algorithm') == 'DCT_ADDITIVE':
            extracted = extract_dwt_dct_additive(cover_img, uploaded_img, meta)
        else:
            # Fallback hoặc báo lỗi nếu dùng file .pkl cũ (SVD)
            # Vì bạn muốn sửa lỗi False Positive, ta coi như file cũ không hợp lệ
            return {
                "score": 0.0,
                "detected": False,
                "reason": "Incompatible metadata (Old algorithm)"
            }

        score = nc(wm_original, extracted)

        # Ngưỡng phát hiện: Với thuật toán cộng tính, > 0.5 là rất cao
        detected = float(score) > 0.5

        return {
            "score": float(score),
            "detected": bool(detected),
            "reason": "Success"
        }

    except Exception as e:
        print("Check algorithm error:", str(e))
        # traceback.print_exc() # Bật lên nếu muốn debug chi tiết
        return {
            "score": 0.0,
            "detected": False,
            "reason": f"System Error: {str(e)}"
        }