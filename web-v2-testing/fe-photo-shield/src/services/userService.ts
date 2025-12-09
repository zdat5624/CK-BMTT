// services/user.service.ts
import api from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constant/storageKey.constant";
import { UserLoginInfo } from "./authService";

/* ============================
   Interfaces
=============================== */

export interface UpdateUserInfoPayload {
    fullName?: string;
    birthday?: string; // Format: YYYY-MM-DD
    sex?: string;
    address?: string;
}

export interface UpdateAvatarResponse {
    message: string;
    avatar: string; // Tên file mới
    url: string;    // Đường dẫn đầy đủ để hiển thị
}

/* ============================
   User Service
=============================== */

export const userService = {
    /** * Cập nhật thông tin cá nhân (trừ avatar, points)
     * Method: PATCH /users/info
     */
    async updateUserInfo(payload: UpdateUserInfoPayload): Promise<UserLoginInfo> {
        const res = await api.patch<UserLoginInfo>("/users/info", payload);



        return res.data;
    },

    /** * Upload và cập nhật Avatar
     * Method: POST /users/avatar
     */
    async updateAvatar(file: File): Promise<UpdateAvatarResponse> {
        const formData = new FormData();
        formData.append("file", file);

        // ❌ SAI: Đừng set header này thủ công
        /* const res = await api.post<UpdateAvatarResponse>("/users/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" }, 
        });
        */

        // ✅ ĐÚNG: Để Axios tự động xử lý (nó sẽ tự thêm boundary)
        const res = await api.post<UpdateAvatarResponse>("/users/avatar", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        });

        return res.data;
    },
};