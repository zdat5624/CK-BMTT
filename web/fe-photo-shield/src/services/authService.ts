// services/auth.service.ts
import { GenderEnum } from "@/enum";
import api from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constant/storageKey.constant";

/* ============================
   Interfaces
=============================== */

export interface AuthResponse {
    access_token: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface SignupPayload {
    phoneNumber: string;
    fullName: string;
    email: string;
    password: string;
    sex?: string;
}

export interface UserLoginInfo {
    id: number;
    phone_number: string;
    email: string;
    full_name: string;
    role: string;
    avatar?: string | null;

    detail: {
        id: number;
        birthday: string;
        sex: GenderEnum;
        avatar: string;
        address: string;
        points: number;
        userId: number
    }
}

/* ============================
   Auth Service
=============================== */

export const authService = {
    /** Đăng nhập */
    async login(payload: LoginPayload): Promise<AuthResponse> {
        const res = await api.post<AuthResponse>("/auth/login", payload);

        const token = res.data.access_token;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);

        await this.getUserLoginInfo();

        return res.data;
    },

    /** Đăng ký */
    async signup(payload: SignupPayload): Promise<AuthResponse> {
        const res = await api.post<AuthResponse>("/auth/signup", payload);

        const token = res.data.access_token;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);

        return res.data;
    },

    /** Lấy thông tin user */
    async getUserLoginInfo(): Promise<UserLoginInfo | null> {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (!token) return null;

        try {
            const res = await api.get<UserLoginInfo>("/auth/me");

            localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(res.data));

            return res.data;
        } catch {
            return null;
        }
    },

    /** Đăng xuất */
    logout() {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);

        window.location.href = "/auth/login";
    }
};
