import sys
import cv2
import numpy as np
import pywt
import pickle
import json

# --- 1. Các hàm thuật toán DWT-DCT-SVD cốt lõi ---
def dct2(block):
    return cv2.dct(block)

def idct2(block):
    return cv2.idct(block)

def extract_dwt_dct_svd(cover_color, watermarked_color, meta, alpha=0.44):
    wavelet = meta['wavelet']
    Uw, Vw, Sc = meta['Uw'], meta['Vw'], meta['Sc']

    # Resize ảnh upload về đúng kích thước ảnh gốc nếu cần
    if cover_color.shape != watermarked_color.shape:
        watermarked_color = cv2.resize(watermarked_color, (cover_color.shape[1], cover_color.shape[0]))

    cover_y = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)[:, :, 0].astype(np.float32)
    wtr_y = cv2.cvtColor(watermarked_color, cv2.COLOR_BGR2YCrCb)[:, :, 0].astype(np.float32)

    LL_c, _ = pywt.dwt2(cover_y, wavelet)
    LL_m, _ = pywt.dwt2(wtr_y, wavelet)

    dct_LL_c = dct2(LL_c)
    dct_LL_m = dct2(LL_m)

    Sc_c = np.linalg.svd(dct_LL_c, full_matrices=False)[1]
    Sc_m = np.linalg.svd(dct_LL_m, full_matrices=False)[1]

    k = min(len(Sc_c), len(Sc_m), Uw.shape[1])

    try:
        Sw_rec = (Sc_m[:k] - Sc_c[:k])/alpha
        wm_rec = Uw[:, :k] @ np.diag(Sw_rec) @ Vw[:k, :]

        wm_rec = wm_rec - wm_rec.min()
        if wm_rec.max() != 0:
            wm_rec = wm_rec / wm_rec.max()

        wm_out = cv2.resize(np.uint8(np.clip(wm_rec*255, 0, 255)), meta['original_wm_shape'][::-1])
        return wm_out
    except Exception:
        # Trả về ma trận rỗng nếu lỗi dimension
        return np.zeros(meta['original_wm_shape'][0], dtype=np.uint8) 

def nc(wm_original, wm_extracted):
    # Hàm tính Normalized Correlation (Độ tương đồng)
    if wm_original.shape != wm_extracted.shape:
        wm_extracted = cv2.resize(wm_extracted, (wm_original.shape[1], wm_original.shape[0]))

    wm_original = wm_original.flatten().astype(float)
    wm_extracted = wm_extracted.flatten().astype(float)

    norm1 = np.linalg.norm(wm_original)
    norm2 = np.linalg.norm(wm_extracted)

    if norm1 == 0 or norm2 == 0:
        return 0

    return np.dot(wm_original, wm_extracted) / (norm1 * norm2)

# --- 2. Main Process ---
if __name__ == "__main__":
    try:
        # 0: Script Path, 1: Cover Path, 2: Upload Path, 3: Meta Path, 4: WM Origin Path
        cover_path = sys.argv[1]
        upload_path = sys.argv[2]
        meta_path = sys.argv[3]
        wm_origin_path = sys.argv[4]

        cover = cv2.imread(cover_path)
        uploaded = cv2.imread(upload_path)
        wm_origin = cv2.imread(wm_origin_path, 0) # Load gray scale

        if cover is None or uploaded is None or wm_origin is None:
            print(json.dumps({"error": "Cannot load required image files"}))
            sys.exit(1)

        # Load Metadata
        with open(meta_path, 'rb') as f:
            meta = pickle.load(f)

        # Trích xuất
        extracted_wm = extract_dwt_dct_svd(cover, uploaded, meta, alpha=0.44)

        # Tính độ tương đồng
        score = nc(wm_origin, extracted_wm)

        # Trả kết quả JSON về cho Node.js (Ngưỡng phát hiện: > 0.6)
        result = {
            "score": score,
            "detected": score > 0.6
        }
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)