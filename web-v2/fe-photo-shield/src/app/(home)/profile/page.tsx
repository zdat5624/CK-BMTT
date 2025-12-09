// src/app/profile/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Button,
    DatePicker,
    Select,
    Avatar,
    message,
    Card,
    Descriptions,
    Tag,
    Modal,
    Upload,
    Tooltip
} from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    EditOutlined,
    SaveOutlined,
    CameraOutlined,
    TrophyOutlined,
    ManOutlined,
    WomanOutlined,
    CloseOutlined,
    UploadOutlined,
    GlobalOutlined,
    FireOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { UploadFile, UploadProps } from 'antd';
import { useAuthContext } from '@/contexts/AuthContext';
import { userService, UpdateUserInfoPayload } from '@/services';
// Import Enum
import { GenderEnum } from '@/enum';

// --- Helper: Xử lý URL Avatar ---
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const getAvatarUrl = (path?: string) => {
    if (!path) return undefined;
    if (path.startsWith('http') || path.startsWith('https')) return path;

    // Xử lý dấu / để tránh double slash (//)
    const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${cleanBase}${cleanPath}`;
};

export default function ProfileGeneralPage() {
    const { user, setUser } = useAuthContext();
    const [form] = Form.useForm();

    // State
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Avatar Modal State
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState<UploadFile[]>([]);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

    // --- Effect: Fill dữ liệu vào Form ---
    useEffect(() => {
        if (user && user.detail) {
            form.setFieldsValue({
                fullName: user.full_name,
                address: user.detail.address,
                sex: user.detail.sex,
                birthday: user.detail.birthday ? dayjs(user.detail.birthday) : undefined,
            });
        }
    }, [user, form]);

    // --- Handler: Cập nhật thông tin ---
    const handleUpdateInfo = async (values: any) => {
        setLoading(true);
        try {
            const payload: UpdateUserInfoPayload = {
                fullName: values.fullName,
                address: values.address,
                sex: values.sex,
                birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
            };

            const updatedUser = await userService.updateUserInfo(payload);

            const newUserState = { ...user!, ...updatedUser };
            setUser(newUserState);
            localStorage.setItem("user_info", JSON.stringify(newUserState));

            message.success("Cập nhật thông tin thành công!");
            setIsEditing(false);
        } catch (error) {
            message.error("Cập nhật thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // --- Handler: Upload Avatar ---
    const handleAvatarUpload = async () => {
        if (avatarFile.length === 0) return;

        // Lấy file chuẩn từ Antd Upload
        const file = (avatarFile[0].originFileObj || avatarFile[0]) as File;

        setUploadingAvatar(true);
        try {
            const res = await userService.updateAvatar(file);

            if (user && user.detail) {
                const newUserState = {
                    ...user,
                    detail: {
                        ...user.detail,
                        avatar: res.avatar
                    }
                };
                setUser(newUserState);
                localStorage.setItem("user_info", JSON.stringify(newUserState));
            }

            message.success("Đổi ảnh đại diện thành công!");
            setIsAvatarModalOpen(false);
            setAvatarFile([]);
            setPreviewAvatar(null);
        } catch (error) {
            message.error("Lỗi khi tải ảnh lên.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const uploadProps: UploadProps = {
        onRemove: () => {
            setAvatarFile([]);
            setPreviewAvatar(null);
        },
        beforeUpload: (file) => {
            setAvatarFile([file as any]);
            setPreviewAvatar(URL.createObjectURL(file));
            return false;
        },
        fileList: avatarFile,
        maxCount: 1,
        accept: "image/*"
    };

    if (!user) return null;

    return (
        <div className="max-w-5xl mx-auto pb-10">
            {/* --- HEADER COVER & AVATAR --- */}
            <div className="relative mb-24">

                {/* 1. Cover Image */}
                <div className="h-52 w-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-b-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>

                    {/* Điểm tích lũy - ĐÃ SỬA: Dời lên top-4 để tránh đè nút sửa */}
                    <div className="absolute top-4 right-6 md:right-12 text-white text-right z-10">
                        <div className="text-sm opacity-90 font-medium">Điểm tích lũy</div>
                        <div className="text-3xl font-bold flex items-center justify-end gap-2 drop-shadow-md">
                            <FireOutlined className="text-yellow-300" /> {user.detail?.points || 0}
                        </div>
                    </div>
                </div>

                {/* 2. Flex Container: Chứa Avatar + Info (Trái) và Nút Sửa (Phải) */}
                <div className="absolute bottom-5 left-6 md:left-12 right-6 md:right-12 flex items-end justify-between">

                    {/* LEFT SIDE: Avatar + Tên */}
                    <div className="flex items-end gap-5">
                        {/* Avatar Wrapper */}
                        <div className="relative group z-10">
                            <Avatar
                                size={128}
                                src={getAvatarUrl(user.detail?.avatar)}
                                icon={<UserOutlined />}
                                className="!bg-white !border-4 !border-white/50 shadow-lg cursor-pointer transition-transform group-hover:scale-105"
                                onClick={() => setIsAvatarModalOpen(true)}
                            />
                            <Tooltip title="Đổi ảnh đại diện">
                                <div
                                    onClick={() => setIsAvatarModalOpen(true)}
                                    className="absolute bottom-2 right-2 bg-slate-800 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-md border-2 border-white flex items-center justify-center"
                                >
                                    <CameraOutlined style={{ fontSize: '16px' }} />
                                </div>
                            </Tooltip>
                        </div>

                        {/* Name & Role */}
                        <div className="mb-3 z-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-md">
                                {user.full_name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Tag className="m-0 border-none px-3 py-0.5 text-sm font-medium rounded-full bg-white/20 text-white backdrop-blur-sm">
                                    {user.role || 'Member'}
                                </Tag>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Nút Chỉnh sửa (Chỉ hiện trên Desktop) */}
                    <div className="mb-3 hidden md:block">
                        {!isEditing ? (
                            <Button
                                type="default"
                                icon={<EditOutlined />}
                                onClick={() => setIsEditing(true)}
                                size="middle"
                                className="bg-white/90 border-none shadow-md hover:!bg-white text-blue-600 font-semibold"
                            >
                                Chỉnh sửa
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => { setIsEditing(false); form.resetFields(); }}
                                    icon={<CloseOutlined />}
                                    className="bg-white/20 border-white/40 text-white hover:!bg-white/30 hover:!text-white border-none backdrop-blur-sm"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={() => form.submit()}
                                    loading={loading}
                                    className="bg-green-500 hover:bg-green-400 border-none shadow-md"
                                >
                                    Lưu
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Edit Button (Chỉ hiện trên Mobile, nằm dưới khu vực cover) */}
            <div className="md:hidden flex justify-end px-6 -mt-16 mb-6">
                {!isEditing ? (
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => setIsEditing(true)}
                        className="shadow-sm"
                    >
                        Chỉnh sửa
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button onClick={() => { setIsEditing(false); form.resetFields(); }}>Hủy</Button>
                        <Button type="primary" onClick={() => form.submit()} loading={loading}>Lưu</Button>
                    </div>
                )}
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">

                {/* --- CỘT TRÁI: THÔNG TIN TÀI KHOẢN (Read Only) --- */}
                <div className="md:col-span-1 space-y-6">
                    <Card title="Thông tin tài khoản" className="shadow-sm rounded-xl border-gray-100" bordered={false}>
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><PhoneOutlined /></div>
                                <div>
                                    <div className="text-xs text-gray-400 font-medium uppercase">Số điện thoại</div>
                                    <div className="font-semibold text-gray-700">{user.phone_number}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg text-green-500"><MailOutlined /></div>
                                <div>
                                    <div className="text-xs text-gray-400 font-medium uppercase">Email</div>
                                    <div className="font-semibold text-gray-700 break-all">{user.email || 'Chưa cập nhật'}</div>
                                </div>
                            </div>


                        </div>
                    </Card>
                </div>

                {/* --- CỘT PHẢI: FORM CẬP NHẬT --- */}
                <div className="md:col-span-2">
                    <Card title="Thông tin cá nhân" className="shadow-sm rounded-xl border-gray-100 h-full" bordered={false}>
                        {isEditing ? (
                            /* --- MODE: EDIT --- */
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleUpdateInfo}
                                className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
                            >
                                <Form.Item name="fullName" label="Họ và tên" className="md:col-span-2" rules={[{ required: true }]}>
                                    <Input prefix={<UserOutlined className="text-gray-400" />} size="large" />
                                </Form.Item>

                                <Form.Item name="birthday" label="Ngày sinh">
                                    <DatePicker className="w-full" size="large" format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
                                </Form.Item>

                                <Form.Item name="sex" label="Giới tính">
                                    <Select size="large" placeholder="Chọn giới tính">
                                        <Select.Option value={GenderEnum.MALE}><ManOutlined /> Nam</Select.Option>
                                        <Select.Option value={GenderEnum.FEMALE}><WomanOutlined /> Nữ</Select.Option>
                                        <Select.Option value={GenderEnum.OTHER}><GlobalOutlined /> Khác</Select.Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item name="address" label="Địa chỉ" className="md:col-span-2">
                                    <Input.TextArea rows={3} placeholder="Nhập địa chỉ..." className="resize-none" />
                                </Form.Item>
                            </Form>
                        ) : (
                            /* --- MODE: VIEW --- */
                            <Descriptions column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }} size="middle" className="mt-1" labelStyle={{ color: '#6b7280', width: '140px' }} contentStyle={{ fontWeight: 500, color: '#1f2937' }}>
                                <Descriptions.Item label={<span><UserOutlined /> Họ và tên</span>}>
                                    {user.full_name}
                                </Descriptions.Item>
                                <Descriptions.Item label={<span><ManOutlined /> Giới tính</span>}>
                                    {user.detail?.sex === GenderEnum.MALE ? <Tag color="blue">Nam</Tag> :
                                        user.detail?.sex === GenderEnum.FEMALE ? <Tag color="magenta">Nữ</Tag> :
                                            <Tag>Khác</Tag>}
                                </Descriptions.Item>
                                <Descriptions.Item label={<span><UserOutlined /> Ngày sinh</span>}>
                                    {user.detail?.birthday ? dayjs(user.detail.birthday).format('DD/MM/YYYY') : <span className="text-gray-400 italic font-normal">--/--/----</span>}
                                </Descriptions.Item>
                                <Descriptions.Item label={<span><HomeOutlined /> Địa chỉ</span>}>
                                    {user.detail?.address || <span className="text-gray-400 italic font-normal">Chưa cập nhật</span>}
                                </Descriptions.Item>
                            </Descriptions>
                        )}
                    </Card>
                </div>
            </div>

            {/* --- MODAL UPLOAD AVATAR --- */}
            <Modal
                title="Cập nhật ảnh đại diện"
                open={isAvatarModalOpen}
                onCancel={() => {
                    setIsAvatarModalOpen(false);
                    setAvatarFile([]);
                    setPreviewAvatar(null);
                }}
                footer={[
                    <Button key="cancel" onClick={() => setIsAvatarModalOpen(false)}>Hủy</Button>,
                    <Button key="submit" type="primary" loading={uploadingAvatar} onClick={handleAvatarUpload} disabled={avatarFile.length === 0}>
                        Lưu ảnh
                    </Button>
                ]}
                centered
            >
                <div className="flex flex-col items-center justify-center gap-6 py-4">
                    <div className="relative">
                        <Avatar
                            size={180}
                            src={previewAvatar || getAvatarUrl(user.detail?.avatar)}
                            icon={<UserOutlined />}
                            className="!bg-white !border-4 !border-gray-100 shadow-inner"
                        />
                    </div>
                    <Upload {...uploadProps} showUploadList={false}>
                        <Button icon={<UploadOutlined />} size="large">Chọn ảnh từ thiết bị</Button>
                    </Upload>
                </div>
            </Modal>
        </div>
    );
}