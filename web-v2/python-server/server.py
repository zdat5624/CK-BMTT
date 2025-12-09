from fastapi import FastAPI, UploadFile, File, Form
import uvicorn
import numpy as np
import pickle
import cv2

from embed_watermark import embed_main
from check_watermark import check_main

app = FastAPI()


def load_image_from_bytes(data, mode="color"):
    arr = np.frombuffer(data, np.uint8)
    if mode == "gray":
        return cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


# --------------------
#       EMBED
# --------------------
@app.post("/embed")
async def embed_endpoint(
    cover: UploadFile = File(...),
    watermark: UploadFile = File(...),
    output_img_path: str = Form(...),
    output_meta_path: str = Form(...)
):
    cover_bytes = await cover.read()
    wm_bytes = await watermark.read()

    cover_img = load_image_from_bytes(cover_bytes, "color")
    watermark_img = load_image_from_bytes(wm_bytes, "color")
    watermark_img = cv2.cvtColor(watermark_img, cv2.COLOR_BGR2GRAY)

    if cover_img is None or watermark_img is None:
        return {"error": "Invalid input images"}

    success, meta = embed_main(
        cover_img,
        watermark_img,
        output_img_path,
        output_meta_path,
    )

    return {"success": success, "meta_saved": True}


# --------------------
#       CHECK
# --------------------
@app.post("/check")
async def check_endpoint(
    uploaded: UploadFile = File(...),
    cover: UploadFile = File(...),
    meta: UploadFile = File(...),
    watermark: UploadFile = File(...)
):
    uploaded_img = load_image_from_bytes(await uploaded.read(), "color")
    cover_img = load_image_from_bytes(await cover.read(), "color")
    # watermark_img = load_image_from_bytes(await watermark.read(), "gray")
    watermark_img = load_image_from_bytes(await watermark.read(), "color")
    watermark_img = cv2.cvtColor(watermark_img, cv2.COLOR_BGR2GRAY)

    meta_obj = pickle.loads(await meta.read())

    if uploaded_img is None or cover_img is None:
        return {"error": "Cannot decode images"}

    result = check_main(uploaded_img, cover_img, meta_obj, watermark_img)
    return result


if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)


# uvicorn server:app --host 127.0.0.1 --port 8000 --reload
