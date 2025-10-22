
"""
DWT-DCT-SVD watermarking (non-blind demo)

- Nhúng watermark:
    cover_color (BGR) + watermark (grayscale) -> watermarked_color (BGR)
    Steps (high level):
      1) Convert cover -> YCrCb, take Y channel
      2) 1-level DWT on Y -> (LL, (LH, HL, HH))
      3) Apply DCT to LL
      4) SVD on DCT(LL): Uc, Sc, Vc
      5) Resize watermark -> same size as DCT(LL)
      6) SVD on watermark_resized: Uw, Sw, Vw
      7) Modify Sc' = Sc + alpha * Sw
      8) Reconstruct DCT(LL)' = Uc @ diag(Sc') @ Vc
      9) IDCT, IDWT, merge YCrCb -> BGR

- Tách watermark (non-blind):
    Requires cover_color and watermark_original (to obtain Uw, Vw)
    Steps:
      1) Compute DCT(LL) of cover and watermarked -> S_c, S_m
      2) Estimate Sw_rec = (S_m - S_c) / alpha
      3) Reconstruct watermark_est = Uw @ diag(Sw_rec) @ Vw
      4) Normalize & return

Notes:
- Non-blind: needs original cover and original watermark's Uw,Vw (or watermark itself).
- This approach is more robust than simple DCT embedding.
"""

import os
import cv2
import numpy as np
import pywt
import matplotlib.pyplot as plt
from skimage.metrics import structural_similarity as ssim

# -----------------------
# Utilities
# -----------------------
def psnr(a, b):
    a = a.astype(np.float32)
    b = b.astype(np.float32)
    mse = np.mean((a - b) ** 2)
    if mse == 0:
        return float('inf')
    return 20 * np.log10(255.0 / np.sqrt(mse))

def ncc(a, b):
    a = a.astype(np.float32).flatten()
    b = b.astype(np.float32).flatten()
    a_mean = a.mean(); b_mean = b.mean()
    num = np.sum((a - a_mean) * (b - b_mean))
    den = np.sqrt(np.sum((a - a_mean)**2) * np.sum((b - b_mean)**2))
    if den == 0:
        return 0.0
    return num / den

def nc(wm_original, wm_extracted):
    """
    Tính hệ số tương quan chuẩn hóa (Normalized Correlation - NCC)
    giữa watermark gốc và watermark trích xuất.

    Parameters:
        wm_original: np.ndarray - ảnh watermark gốc (grayscale)
        wm_extracted: np.ndarray - ảnh watermark trích xuất (grayscale)

    Returns:
        float: NC trong khoảng [0, 1]
    """
    wm_original = wm_original.astype(np.float32).flatten()
    wm_extracted = wm_extracted.astype(np.float32).flatten()

    # Trừ trung bình (mean)
    wm_original -= np.mean(wm_original)
    wm_extracted -= np.mean(wm_extracted)

    num = np.sum(wm_original * wm_extracted)
    den = np.sqrt(np.sum(wm_original ** 2) * np.sum(wm_extracted ** 2))

    if den == 0:
        return 0.0

    # Kết quả lý tưởng: NC ≈ 1
    nc_value = num / den

    # Giới hạn trong [0, 1]
    return max(0.0, min(1.0, nc_value))

def nc_no_mean(wm_original, wm_extracted):
    wm_original = wm_original.astype(np.float32).flatten()
    wm_extracted = wm_extracted.astype(np.float32).flatten()
    num = np.sum(wm_original * wm_extracted)
    den = np.sqrt(np.sum(wm_original ** 2) * np.sum(wm_extracted ** 2))
    if den == 0:
        return 0.0
    return num / den

# -----------------------
# Core functions
# -----------------------
def dct2(block):
    return cv2.dct(block)

def idct2(block):
    return cv2.idct(block)

def embed_dwt_dct_svd(cover_color, watermark, alpha=0.1, wavelet='haar'):
    """
    cover_color: BGR image (H x W x 3) uint8
    watermark: grayscale image (h x w) uint8
    alpha: embedding strength applied on singular values
    returns: watermarked_color (BGR uint8), metadata (dict) for extraction
    metadata contains: shapes and S_c (singular values of cover) and Uw, Vw (from watermark SVD)
    """
    # 1) convert to YCrCb and take Y
    ycrcb = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)
    y, cr, cb = cv2.split(ycrcb)
    y_f = np.float32(y)

    # 2) 1-level DWT on Y
    # pywt.dwt2 returns (LL, (LH, HL, HH))
    LL, (LH, HL, HH) = pywt.dwt2(y_f, wavelet)

    # 3) DCT on LL
    dct_LL = dct2(LL)

    # 4) SVD on dct_LL
    Uc, Sc, Vc = np.linalg.svd(dct_LL, full_matrices=False)  # Sc is 1D array

    # 5) Resize watermark to match dct_LL shape
    target_h, target_w = dct_LL.shape
    wm_resized = cv2.resize(watermark, (target_w, target_h), interpolation=cv2.INTER_LINEAR)
    wm_resized = np.float32(wm_resized)

    # 6) SVD on watermark_resized
    Uw, Sw, Vw = np.linalg.svd(wm_resized, full_matrices=False)

    # 7) Modify singular values: Sc' = Sc + alpha * Sw (align lengths)
    k = min(len(Sc), len(Sw))
    Sc_mod = Sc.copy()
    Sc_mod[:k] = Sc[:k] + alpha * Sw[:k]

    # 8) Reconstruct modified DCT(LL)
    S_mat = np.diag(Sc_mod)
    dct_LL_mod = Uc @ S_mat @ Vc

    # 9) IDCT and inverse DWT
    LL_mod = idct2(dct_LL_mod)
    # Recompose Y via inverse DWT
    y_wm = pywt.idwt2((LL_mod, (LH, HL, HH)), wavelet)
    # Ensure same size as original y (pywt may produce floats with small shape diff)
    y_wm = y_wm[:y.shape[0], :y.shape[1]]
    y_wm = np.uint8(np.clip(y_wm, 0, 255))

    # merge channels and convert back to BGR
    ycrcb_wm = cv2.merge((y_wm, cr, cb))
    watermarked_color = cv2.cvtColor(ycrcb_wm, cv2.COLOR_YCrCb2BGR)

    # store metadata required for extraction (non-blind)
    meta = {
        'wavelet': wavelet,
        'Uc_shape': Uc.shape,
        'Vc_shape': Vc.shape,
        'Sc': Sc,            # singular values of cover's dct_LL
        'Uw': Uw,            # U of watermark SVD
        'Vw': Vw,            # V of watermark SVD
        'original_wm_shape': watermark.shape,
        'dct_LL_shape': dct_LL.shape
    }

    return watermarked_color, meta

def extract_dwt_dct_svd(cover_color, watermarked_color, meta, alpha=0.1):
    """
    Non-blind extraction using cover_color and meta from embedding.
    Returns reconstructed watermark (float image scaled to 0..255).
    """
    wavelet = meta['wavelet']
    Uw = meta['Uw']; Vw = meta['Vw']; Sc = meta['Sc']
    target_h, target_w = meta['dct_LL_shape']

    # Get Y channels and DWT/DCT similar to embedding
    cover_y = cv2.cvtColor(cover_color, cv2.COLOR_BGR2YCrCb)[:, :, 0].astype(np.float32)
    wtr_y = cv2.cvtColor(watermarked_color, cv2.COLOR_BGR2YCrCb)[:, :, 0].astype(np.float32)

    LL_c, (LH_c, HL_c, HH_c) = pywt.dwt2(cover_y, wavelet)
    LL_m, (LH_m, HL_m, HH_m) = pywt.dwt2(wtr_y, wavelet)

    dct_LL_c = dct2(LL_c)
    dct_LL_m = dct2(LL_m)

    # SVDs
    Uc_c, Sc_c, Vc_c = np.linalg.svd(dct_LL_c, full_matrices=False)
    Uc_m, Sc_m, Vc_m = np.linalg.svd(dct_LL_m, full_matrices=False)

    # Recover singular values of watermark: Sw_rec = (Sc_m - Sc_c) / alpha
    k = min(len(Sc_c), len(Sc_m), len(Uw))
    Sw_rec = np.zeros_like(Uw.shape[1:] if False else np.zeros(k))  # just create vector
    # compute
    Sw_rec = (Sc_m[:k] - Sc_c[:k]) / alpha

    # Reconstruct watermark_est = Uw[:, :k] @ diag(Sw_rec) @ Vw[:k, :]
    Uw_k = Uw[:, :k]
    Vw_k = Vw[:k, :]
    S_w_mat = np.diag(Sw_rec)
    wm_rec = Uw_k @ S_w_mat @ Vw_k

    # Normalize reconstructed watermark to 0..255
    wm_rec_norm = wm_rec - wm_rec.min()
    if wm_rec_norm.max() != 0:
        wm_rec_norm = wm_rec_norm / wm_rec_norm.max()
    wm_rec_uint8 = np.uint8(np.clip(wm_rec_norm * 255.0, 0, 255))

    # Resize to original watermark shape if needed
    orig_h, orig_w = meta['original_wm_shape']
    wm_out = cv2.resize(wm_rec_uint8, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
    return wm_out

# -----------------------
# Demo / usage
# -----------------------
if __name__ == "__main__":
    # paths (put your files in input/)
    input_dir = "input"
    output_dir = "output_dwt_dct_svd"
    os.makedirs(output_dir, exist_ok=True)

    cover_path = os.path.join(input_dir, "iceberg-9729318_1920.jpg")       # replace with your cover
    watermark_path = os.path.join(input_dir, "watermark.png")  # grayscale logo

    cover = cv2.imread(cover_path)
    wm = cv2.imread(watermark_path, cv2.IMREAD_GRAYSCALE)

    if cover is None or wm is None:
        print("Please put cover.jpg and watermark.png into the 'input' folder.")
        raise SystemExit

    # embed
    alpha = 0.1
    watermarked, meta = embed_dwt_dct_svd(cover, wm, alpha=alpha, wavelet='haar')
    cv2.imwrite(os.path.join(output_dir, "cover.png"), cover)
    cv2.imwrite(os.path.join(output_dir, "watermarked.png"), watermarked)

    # extract (non-blind; uses original cover and stored meta)
    watermarked = cv2.imread("./input/watermarked_color.png")
    extracted = extract_dwt_dct_svd(cover, watermarked, meta, alpha=alpha)
    cv2.imwrite(os.path.join(output_dir, "extracted.png"), extracted)

    # metrics (compare watermark & extracted)
    # print("PSNR cover vs watermarked:", psnr(cover, watermarked))
    print("NCC watermark vs extracted:", ncc(wm, extracted))
    print(f"NC watermark vs extracted: {nc(wm, extracted)}")
    # SSIM (watermark images)
    try:
        s = ssim(wm, extracted, data_range=255)
        print("SSIM watermark vs extracted:", s)
    except Exception as e:
        print("SSIM error:", e)

    # show
    plt.figure(figsize=(12,6))
    plt.subplot(1,4,1); 
    plt.imshow(cv2.cvtColor(cover, cv2.COLOR_BGR2RGB)); 
    plt.title("Cover"); plt.axis('off')

    plt.subplot(1,4,2); 
    plt.imshow(cv2.cvtColor(watermarked, cv2.COLOR_BGR2RGB)); 
    plt.title("Watermarked"); 
    plt.axis('off')


    plt.subplot(1,4,3); 
    plt.imshow(wm, cmap='gray'); 
    plt.title("Watermark"); 
    plt.axis('off')
    plt.subplot(1,4,4); 
    
    
    plt.imshow(extracted, cmap='gray'); 
    plt.title("Extracted WM"); 
    plt.axis('off')

    plt.tight_layout()

    plt.show()

