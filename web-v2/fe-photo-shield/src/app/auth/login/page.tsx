// src/app/auth/login/page.tsx
"use client";

import { Form, Input, Button, message } from "antd";
import { ArrowLeftOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import Link from "next/link";
import { authService, LoginPayload } from "@/services";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const onFinish = async (values: LoginPayload) => {
        try {
            setLoading(true);
            await authService.login(values);
            message.success("Đăng nhập thành công!");
            setLoading(false);
            // 💡 CẬP NHẬT: Buộc tải lại trang để AuthContext và Header cập nhật
            window.location.href = "/";

        } catch (error: any) {
            message.error(error.response?.data?.message || "Đăng nhập thất bại!");
            setLoading(false);

        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">

            {/* Hiệu ứng background */}
            <div className="absolute w-72 h-72 bg-blue-300 rounded-full blur-3xl opacity-20 top-10 left-10"></div>
            <div className="absolute w-96 h-96 bg-indigo-300 rounded-full blur-3xl opacity-20 bottom-10 right-10"></div>

            <div className="relative z-10 w-full max-w-md bg-white/40 backdrop-blur-xl shadow-2xl rounded-2xl px-10 py-12 border border-white/20">

                {/* Nút quay lại */}
                <Link
                    href="/"
                    className="flex items-center text-blue-700 hover:text-blue-900 mb-6 transition"
                >
                    <ArrowLeftOutlined className="mr-2" />
                    Quay về trang chủ
                </Link>

                {/* Tiêu đề */}
                <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
                    Chào mừng trở lại
                </h2>
                <p className="text-center text-gray-600 mb-8">
                    Vui lòng đăng nhập để tiếp tục
                </p>

                {/* FORM */}
                <Form layout="vertical" onFinish={onFinish} className="space-y-4">
                    <Form.Item
                        label="Tên đăng nhập"
                        name="username"
                        rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
                    >
                        <Input
                            size="large"
                            prefix={<UserOutlined />}
                            placeholder="Email hoặc số điện thoại"
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu"
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <Button
                        loading={loading}
                        type="primary"
                        htmlType="submit"
                        size="large"
                        className="w-full rounded-xl mt-2"
                    >
                        Đăng nhập
                    </Button>
                </Form>

                {/* Footer */}
                <p className="text-center mt-4 pt-4 text-gray-700">
                    Chưa có tài khoản?{" "}
                    <Link href="/auth/signup" className="text-blue-700 font-semibold hover:underline">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}