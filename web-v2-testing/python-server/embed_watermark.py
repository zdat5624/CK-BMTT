import cv2
import numpy as np
import pywt
import pickle
import os

def dct2(block):
    return cv2.dct(block)

def idct2(block):
    return cv2.idct(block)

def embed_dwt_dct_additive(cover_color, watermark, alpha=5.0, wavelet='haar'):
    # BGR -> YCrCb
    ycrcb = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)
    y, cr, cb = cv2.split(ycrcb)

    # DWT
    y_f = np.float32(y)
    LL, (LH, HL, HH) = pywt.dwt2(y_f, wavelet)

    # DCT ảnh gốc
    dct_LL = dct2(LL)

    # --- FIX LỖI: Chuyển Watermark sang miền DCT trước khi cộng ---
    h, w = dct_LL.shape
    wm_resized = cv2.resize(watermark, (w, h))
    wm_f = np.float32(wm_resized)
    
    # DCT watermark
    dct_wm = dct2(wm_f)

    # Cộng tính trong miền tần số (Frequency Domain Additive)
    # DCT_new = DCT_old + (alpha * DCT_watermark)
    dct_LL_mod = dct_LL + (alpha * dct_wm)

    # IDCT
    LL_mod = idct2(dct_LL_mod)

    # IDWT
    y_wm = pywt.idwt2((LL_mod, (LH, HL, HH)), wavelet)
    y_wm = np.uint8(np.clip(y_wm[:y.shape[0], :y.shape[1]], 0, 255))

    watermarked = cv2.merge((y_wm, cr, cb))
    watermarked = cv2.cvtColor(watermarked, cv2.COLOR_YCrCb2BGR)

    meta = {
        'algorithm': 'DCT_ADDITIVE_V2', # Đánh dấu phiên bản mới
        'wavelet': wavelet,
        'alpha': alpha,
        'original_wm_shape': watermark.shape,
        'block_shape': (w, h)
    }

    return watermarked, meta

# Giữ nguyên hàm embed_main...
def embed_main(cover_img, wm_img, out_img_path, out_meta_path, alpha=5.0):
    watermarked, meta = embed_dwt_dct_additive(cover_img, wm_img, alpha)

    img_dir = os.path.dirname(out_img_path)
    meta_dir = os.path.dirname(out_meta_path)
    if img_dir: os.makedirs(img_dir, exist_ok=True)
    if meta_dir: os.makedirs(meta_dir, exist_ok=True)

    cv2.imwrite(out_img_path, watermarked)

    with open(out_meta_path, "wb") as f:
        pickle.dump(meta, f)

    return True, meta