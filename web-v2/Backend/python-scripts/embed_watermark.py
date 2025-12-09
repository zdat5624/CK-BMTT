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

def embed_dwt_dct_svd(cover_color, watermark, alpha=0.44, wavelet='haar'):
    ycrcb = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)
    y, cr, cb = cv2.split(ycrcb)
    y_f = np.float32(y)
    LL, (LH, HL, HH) = pywt.dwt2(y_f, wavelet)
    dct_LL = dct2(LL)
    Uc, Sc, Vc = np.linalg.svd(dct_LL, full_matrices=False)

    # Resize watermark theo kích thước LL
    wm_resized = cv2.resize(watermark, (dct_LL.shape[1], dct_LL.shape[0])).astype(np.float32)
    Uw, Sw, Vw = np.linalg.svd(wm_resized, full_matrices=False)

    k = min(len(Sc), len(Sw))
    Sc_mod = Sc.copy()
    Sc_mod[:k] += alpha * Sw[:k]

    dct_LL_mod = Uc @ np.diag(Sc_mod) @ Vc
    LL_mod = idct2(dct_LL_mod)

    y_wm = pywt.idwt2((LL_mod, (LH, HL, HH)), wavelet)
    y_wm = np.uint8(np.clip(y_wm[:y.shape[0], :y.shape[1]], 0, 255))

    watermarked_color = cv2.cvtColor(cv2.merge((y_wm, cr, cb)), cv2.COLOR_YCrCb2BGR)

    meta = {
        'wavelet': wavelet,
        'Sc': Sc,
        'Uw': Uw,
        'Vw': Vw,
        'original_wm_shape': watermark.shape,
    }
    return watermarked_color, meta

# --- 2. Main Process ---
if __name__ == "__main__":
    try:
        # 0: Script Path, 1: Cover Path, 2: WM Path, 3: Output Img Path, 4: Output Meta Path
        cover_path = sys.argv[1]
        wm_path = sys.argv[2]
        output_img_path = sys.argv[3]
        output_meta_path = sys.argv[4]

        cover = cv2.imread(cover_path)
        watermark = cv2.imread(wm_path, 0) # Load grayscale

        if cover is None or watermark is None:
            print(json.dumps({"error": "Cannot read image file or watermark"}))
            sys.exit(1)

        # Thực hiện nhúng
        watermarked_img, meta = embed_dwt_dct_svd(cover, watermark, alpha=0.44)

        # Lưu ảnh kết quả
        cv2.imwrite(output_img_path, watermarked_img)

        # Lưu metadata ra file .pkl
        with open(output_meta_path, 'wb') as f:
            pickle.dump(meta, f)

        print(json.dumps({"success": True}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)