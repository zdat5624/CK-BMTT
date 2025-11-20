import api from "@/lib/api";
import { TIME_OUT_API_FILE } from "./fileService";

/* ============================
   Interfaces
=============================== */

export interface ImageItem {
    id: number;
    image_name: string;
    original_name: string;
    metadata_path: string | null;
    caption?: string;
    category?: string;
    points: number;
    createdAt: string;
    userId: number;

    user?: {
        id: number;
        full_name: string;
        phone_number: string;
        detail?: {
            avatar: string;
            points: number;
        }
    };
}

export interface PaginationMeta {
    page: number;
    size: number;
    total: number;
    totalPages: number;
}

export interface ImageListResponse {
    data: ImageItem[];
    meta: PaginationMeta;
}

/* Create DTO */
export interface CreateImagePayload {
    image_name: string;
    original_name: string;
    metadata_url: string;
    caption?: string;
    category?: string;
    points?: number;
}

/* Update DTO */
export interface UpdateImagePayload {
    image_name?: string;
    original_name?: string;
    metadata_url?: string;
    caption?: string;
    category?: string;
    points?: number;
}

/* Pagination DTO */
export interface ImageQueryParams {
    page?: number;
    size?: number;
    search?: string;
    userId?: number;
    orderBy?: string;
    orderDirection?: "asc" | "desc";
}

/* ============================
   Image Service
=============================== */

export const imageService = {
    /** 1. Create image */
    async create(payload: CreateImagePayload): Promise<ImageItem> {
        const res = await api.post<ImageItem>(
            "/images",
            payload,
            {
                timeout: TIME_OUT_API_FILE,
            });
        return res.data;
    },

    /** 2. Lấy danh sách ảnh (có phân trang + filter) */
    async getAll(params: ImageQueryParams): Promise<ImageListResponse> {
        const res = await api.get<ImageListResponse>("/images", { params });
        return res.data;
    },

    /** 3. Lấy chi tiết 1 ảnh */
    async getById(id: number): Promise<ImageItem> {
        const res = await api.get<ImageItem>(`/images/${id}`);
        return res.data;
    },

    /** 4. Download + trừ điểm */
    async download(id: number): Promise<any> {
        const res = await api.post(`/images/${id}/download`);
        return res.data; // có downloadUrl, pointsSpent,...
    },

    /** 5. Update ảnh (chỉ owner) */
    async update(id: number, payload: UpdateImagePayload): Promise<ImageItem> {
        const res = await api.patch<ImageItem>(`/images/${id}`, payload);
        return res.data;
    },

    /** 6. Xóa (chỉ owner) */
    async remove(id: number): Promise<{ message: string }> {
        const res = await api.delete<{ message: string }>(`/images/${id}`);
        return res.data;
    },
};

