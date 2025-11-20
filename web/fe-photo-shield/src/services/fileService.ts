import api from "@/lib/api";

export interface UploadImageResponse {
    message: string;
    fileUrl: string;
    metaUrl: string;
    originalUrl: string;
}

export interface CheckImageResponse {
    status: "safe" | "unsafe";
    message: string;
    score?: number;
    copyrighted_image_name?: string;
    copyrighted_image_id?: number;
}

export const TIME_OUT_API_FILE = 100000;

/* ============================
   FileService
=============================== */

export const fileService = {
    /** 
     * 1. Upload + Watermark (POST /files/upload/image)
     * @param file: File từ input type="file"
     */
    async uploadImage(file: File): Promise<UploadImageResponse> {
        const formData = new FormData();
        formData.append("image", file);

        const res = await api.post<UploadImageResponse>(
            "/files/upload/image",
            formData,
            {
                timeout: TIME_OUT_API_FILE,
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            }
        );

        return res.data;
    },

    /** 
     * 2. Check image trước khi upload
     * (POST /files/check/image)
     */
    async checkImage(file: File): Promise<CheckImageResponse> {
        const formData = new FormData();
        formData.append("image", file);

        const res = await api.post<CheckImageResponse>(
            "/files/check/image",
            formData,
            {
                timeout: TIME_OUT_API_FILE,
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            }
        );

        return res.data;
    },
};
