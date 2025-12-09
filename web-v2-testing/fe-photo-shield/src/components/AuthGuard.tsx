// src/components/AuthGuard.tsx
"use client";
import { useAuthContext } from "@/contexts/AuthContext"; // Thay đổi đường dẫn nếu cần
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { useEffect } from "react";

/**
 * AuthGuardInner: Logic bảo vệ route
 * @param children Nội dung của trang cần bảo vệ
 */
function AuthGuardInner({ children }: { children: React.ReactNode }) {
    const { loading, isAuthenticated } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
        // Chỉ chuyển hướng nếu đã hoàn tất loading và chưa được xác thực
        if (!loading && !isAuthenticated) {
            // Sử dụng router.replace để ngăn người dùng quay lại trang bảo vệ bằng nút back
            router.replace("/auth/login");
        }
    }, [loading, isAuthenticated, router]);

    // 1. Nếu đang loading, hiển thị Spin
    if (loading)
        return (
            <div style={{ padding: 48, textAlign: "center", minHeight: '80vh' }}>
                <Spin size="large" />
            </div>
        );

    // 2. Nếu đã load xong và KHÔNG được xác thực, trả về null
    // (useEffect sẽ lo việc chuyển hướng, nhưng cần trả về null để không render nội dung trang)
    if (!isAuthenticated) return null;

    // 3. Nếu đã load xong và ĐƯỢC xác thực, render nội dung trang
    return <>{children}</>;
}

/**
 * AuthGuard: Component Wrapper chính
 * @param children Nội dung cần bảo vệ
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
    // Cần phải render AuthGuardInner bên trong một component riêng để đảm bảo useAuthContext
    // hoạt động chính xác trong cây component.
    return <AuthGuardInner>{children}</AuthGuardInner>;
}