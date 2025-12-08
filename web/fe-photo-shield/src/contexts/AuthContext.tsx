// src/contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
// Import UserLoginInfo từ authService
import { authService, UserLoginInfo } from "@/services";
import { STORAGE_KEYS } from "@/lib/constant/storageKey.constant";
import { Spin } from "antd";


interface AuthContextType {
    user: UserLoginInfo | null;
    setUser: React.Dispatch<React.SetStateAction<UserLoginInfo | null>>;
    isAuthenticated: boolean;
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserLoginInfo | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

        if (!token) {
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            try {
                // Thử lấy user từ cache trước để tránh Flash of Unauthenticated Content
                const cachedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
                if (cachedUser) {
                    const parsedUser = JSON.parse(cachedUser);
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                }

                // Gọi API để lấy thông tin user mới nhất
                const res = await authService.getUserLoginInfo();
                if (res) {
                    setUser(res);
                    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(res));
                    setIsAuthenticated(true);
                } else {
                    // Token có thể đã hết hạn hoặc không hợp lệ
                    authService.logout();
                }

            } catch (err) {
                // Xử lý lỗi (ví dụ: token không hợp lệ)
                authService.logout();
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    // Nếu bạn muốn hiển thị loading toàn cục, bạn có thể thêm logic ở đây
    // if (loading) {
    //     return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>;
    // }

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated, setIsAuthenticated, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
    return ctx;
};