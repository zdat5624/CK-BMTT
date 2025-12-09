// src/components/Header.tsx (ĐÃ SỬA ĐỔI)
"use client";

import Link from "next/link";
import { Button, Spin } from "antd";
import { useAuthContext } from "@/contexts/AuthContext";
import UserMenu from "@/components/layouts/UserMenu";

export default function Header() {
    const { isAuthenticated, loading } = useAuthContext();

    return (
        <header className="
            w-full sticky top-0 z-50
            bg-white/80 backdrop-blur-xl
            border-b border-gray-200/60 shadow-sm
        ">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">

                {/* Logo */}
                <Link
                    href="/"
                    className="text-2xl font-semibold tracking-tight text-blue-600 hover:text-blue-700 duration-200"
                >
                    Photo Shield
                </Link>

                {/* Account Actions */}
                {/* 💡 CẬP NHẬT: Thêm chiều cao tối thiểu và căn giữa (items-center) để cố định chiều cao hàng. */}
                <div className="flex items-center gap-3 min-h-[40px]">
                    {loading ? (
                        <Spin size="small" />
                    ) : isAuthenticated ? (
                        <UserMenu />
                    ) : (
                        <>
                            <Link href="/auth/login">
                                <Button size="middle" className="font-medium px-5">
                                    Đăng nhập
                                </Button>
                            </Link>

                            <Link href="/auth/signup">
                                <Button type="primary" size="middle" className="font-medium px-5">
                                    Đăng ký
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}