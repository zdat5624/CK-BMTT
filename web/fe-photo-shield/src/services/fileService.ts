import api from "@/lib/api";

export interface UploadImageResponse {
    message: string;
    fileUrl: string;
    metaUrl: string;
    originalUrl: string;
}

export interface CheckImageResponse {
    // Field thống nhất để UI sử dụng (Do Frontend tự map)
    status: "safe" | "unsafe";

    // Các field từ API
    message: string;
    isSafe?: boolean; // Field gốc từ response Unsafe
    score?: number;
    copyrighted_image_name?: string;
    copyrighted_image_id?: number;
}

export const TIME_OUT_API_FILE = 900000;

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

    /** * 2. Check image trước khi upload
     * (POST /files/check/image)
     */
    async checkImage(file: File): Promise<CheckImageResponse> {
        const formData = new FormData();
        formData.append("image", file);

        // Sử dụng <any> ở đây vì response trả về cấu trúc lộn xộn
        const res = await api.post<any>(
            "/files/check/image",
            formData,
            {
                timeout: TIME_OUT_API_FILE,
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            }
        );

        const data = res.data;

        // --- LOGIC CHUẨN HÓA DỮ LIỆU ---

        // Trường hợp 1: API trả về { status: "safe", ... }
        if (data.status === 'safe') {
            return {
                ...data,
                status: 'safe'
            };
        }

        // Trường hợp 2: API trả về { isSafe: false, ... } -> Map thành status: "unsafe"
        if (data.isSafe === false) {
            return {
                ...data,
                status: 'unsafe',
            };
        }

        // Trường hợp dự phòng (Fallback)
        return {
            ...data,
            status: data.status || 'unsafe', // Mặc định unsafe nếu không rõ
        };
    },
};
