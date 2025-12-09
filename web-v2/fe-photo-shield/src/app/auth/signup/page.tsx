// SignupPage.tsx
"use client";

import { Form, Input, Button, Select, message } from "antd";
import { ArrowLeftOutlined, UserOutlined, PhoneOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import Link from "next/link";
// Chỉ cần import SignupPayload từ services
import { authService, SignupPayload } from "@/services";
import { useRouter } from "next/navigation";
import { useState } from "react";

const { Option } = Select;

// 💡 ĐỊNH NGHĨA INTERFACE CHO FORM DATA NGAY TRONG COMPONENT
// Interface này kế thừa SignupPayload và thêm trường 'confirmPassword'
interface SignupFormData extends SignupPayload {
    confirmPassword?: string;
}

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // SỬ DỤNG SignupFormData CHO VALUES
    const onFinish = async (values: SignupFormData) => {
        // ✅ Tách 'confirmPassword' ra khỏi đối tượng Form
        const { confirmPassword, ...signupPayload } = values;

        try {
            setLoading(true);

            // Ép kiểu signupPayload thành SignupPayload khi gọi service (đảm bảo đúng kiểu API)
            await authService.signup(signupPayload as SignupPayload);
            setLoading(false);

            message.success("Đăng ký thành công!");
            // router.push("/");
            window.location.href = "/";
        } catch (error: any) {
            message.error(error.response?.data?.message || "Đăng ký thất bại!");
            setLoading(false);

        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">

            {/* Background Shapes */}
            <div className="absolute w-72 h-72 bg-indigo-300 rounded-full blur-3xl opacity-20 top-16 left-10"></div>
            <div className="absolute w-96 h-96 bg-blue-300 rounded-full blur-3xl opacity-20 bottom-16 right-10"></div>


            <div className="relative z-10 w-full max-w-lg bg-white/40 backdrop-blur-xl shadow-2xl rounded-2xl px-10 py-12 border border-white/20">

                {/* Back Button */}
                <Link
                    href="/"
                    className="flex items-center text-purple-700 hover:text-purple-900 mb-6 transition"
                >
                    <ArrowLeftOutlined className="mr-2" />
                    Quay về trang chủ
                </Link>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Tạo tài khoản mới
                </h2>

                {/* Signup Form */}
                <Form layout="vertical" onFinish={onFinish} className="space-y-4">

                    <Form.Item
                        label="Số điện thoại"
                        name="phoneNumber"
                        rules={[
                            { required: true, message: "Vui lòng nhập số điện thoại!" },
                            { pattern: /^[0-9]{9,11}$/, message: "Số điện thoại không hợp lệ!" }
                        ]}
                    >
                        <Input
                            size="large"
                            prefix={<PhoneOutlined />}
                            placeholder="Nhập số điện thoại"
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Họ và tên"
                        name="fullName"
                        rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
                    >
                        <Input
                            size="large"
                            prefix={<UserOutlined />}
                            placeholder="Nhập họ và tên"
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Vui lòng nhập email!" },
                            { type: "email", message: "Email không hợp lệ!" }
                        ]}
                    >
                        <Input
                            size="large"
                            prefix={<MailOutlined />}
                            placeholder="Nhập email"
                            className="rounded-xl"
                        />
                    </Form.Item>

                    {/* Trường Mật khẩu */}
                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu!" },
                            { min: 6, message: "Mật khẩu phải ít nhất 6 ký tự!" }
                        ]}
                        hasFeedback
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu"
                            className="rounded-xl"
                        />
                    </Form.Item>

                    {/* Trường Xác nhận Mật khẩu mới */}
                    <Form.Item
                        label="Xác nhận Mật khẩu"
                        name="confirmPassword"
                        dependencies={['password']} // Thiết lập phụ thuộc vào trường 'password'
                        hasFeedback
                        rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Hai mật khẩu đã nhập không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Nhập lại mật khẩu"
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item label="Giới tính" name="sex">
                        <Select
                            size="large"
                            className="rounded-xl"
                            defaultValue="other"
                        >
                            <Option value="male">Nam</Option>
                            <Option value="female">Nữ</Option>
                            <Option value="other">Khác</Option>
                        </Select>
                    </Form.Item>

                    <Button
                        loading={loading}
                        type="primary"
                        htmlType="submit"
                        size="large"
                        className="w-full rounded-xl mt-3"
                    >
                        Đăng ký
                    </Button>
                </Form>

                {/* Footer */}
                <p className="text-center mt-6 pt-4 text-gray-700">
                    Đã có tài khoản?{" "}
                    <Link href="/auth/login" className="text-purple-700 font-semibold hover:underline">
                        Đăng nhập ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}