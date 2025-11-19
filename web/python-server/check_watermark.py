import cv2
import numpy as np
import pywt


def dct2(block):
    return cv2.dct(block)


def extract_dwt_dct_svd(cover_color, wm_color, meta, alpha=0.44):
    wavelet = meta['wavelet']
    Uw = meta['Uw']
    Vw = meta['Vw']
    Sc = meta['Sc']

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

    k = min(len(Sc_c), len(Sc), Uw.shape[1])

    # Khôi phục singular values watermark
    Sw_rec = (Sc_m[:k] - Sc_c[:k]) / alpha

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


def nc(original, extract):
    # Resize nếu cần
    if original.shape != extract.shape:
        extract = cv2.resize(extract, (original.shape[1], original.shape[0]))

    a = original.flatten().astype(float)
    b = extract.flatten().astype(float)

    a = a - np.mean(a)
    b = b - np.mean(b)

    return np.dot(a, b) / np.sqrt(np.dot(a, a) * np.dot(b, b) + 1e-9)


def check_main(uploaded_img, cover_img, meta, wm_original):
    extracted = extract_dwt_dct_svd(cover_img, uploaded_img, meta)

    score = nc(wm_original, extracted)

    detected = float(score) > 0.8

    print("score: ", score)
    print("detected (score) > 0.8: ", detected)


    return {
        "score": float(score),
        "detected": bool(detected)
    }
