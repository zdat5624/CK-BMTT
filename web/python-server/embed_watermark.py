import cv2
import numpy as np
import pywt
import pickle
import os


def dct2(block):
    return cv2.dct(block)


def idct2(block):
    return cv2.idct(block)


def embed_dwt_dct_svd(cover_color, watermark, alpha=0.44, wavelet='haar'):
    # BGR → YCrCb
    ycrcb = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)
    y, cr, cb = cv2.split(ycrcb)

    # DWT
    y_f = np.float32(y)
    LL, (LH, HL, HH) = pywt.dwt2(y_f, wavelet)

    # DCT
    dct_LL = dct2(LL)

    # SVD LL của ảnh cover
    Uc, Sc, Vc = np.linalg.svd(dct_LL, full_matrices=False)

    # Resize watermark theo size LL
    wm_resized = cv2.resize(
        watermark, 
        (dct_LL.shape[1], dct_LL.shape[0])
    ).astype(np.float32)

    # SVD watermark
    Uw, Sw, Vw = np.linalg.svd(wm_resized, full_matrices=False)

    # Nhúng watermark vào singular values
    k = min(len(Sc), len(Sw))
    Sc_mod = Sc.copy()
    Sc_mod[:k] += alpha * Sw[:k]

    # Tạo DCT LL mới
    dct_LL_mod = Uc @ np.diag(Sc_mod) @ Vc
    LL_mod = idct2(dct_LL_mod)

    # IDWT
    y_wm = pywt.idwt2((LL_mod, (LH, HL, HH)), wavelet)
    y_wm = np.uint8(np.clip(y_wm[:y.shape[0], :y.shape[1]], 0, 255))

    watermarked = cv2.merge((y_wm, cr, cb))
    watermarked = cv2.cvtColor(watermarked, cv2.COLOR_YCrCb2BGR)

    meta = {
        'wavelet': wavelet,
        'Uc_shape': Uc.shape,
        'Vc_shape': Vc.shape,
        'dct_LL_shape': dct_LL.shape,
        'Sc': Sc,
        'Uw': Uw,
        'Vw': Vw,
        'original_wm_shape': watermark.shape,
    }

    return watermarked, meta


def embed_main(cover_img, wm_img, out_img_path, out_meta_path, alpha=0.44):
    watermarked, meta = embed_dwt_dct_svd(cover_img, wm_img, alpha)

    img_dir = os.path.dirname(out_img_path)
    meta_dir = os.path.dirname(out_meta_path)
    if img_dir: os.makedirs(img_dir, exist_ok=True)
    if meta_dir: os.makedirs(meta_dir, exist_ok=True)


    cv2.imwrite(out_img_path, watermarked)
    print(img_dir)
    print(meta_dir)

    with open(out_meta_path, "wb") as f:
        pickle.dump(meta, f)

    return True, meta
