// src/components/layouts/UserMenu.tsx (ĐÃ SỬA ĐỔI)
"use client";

import React from 'react';
import Link from 'next/link';
import { Avatar, Dropdown, MenuProps, Modal, Spin, Typography } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    ProfileOutlined,
    FireOutlined,
} from '@ant-design/icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { authService } from '@/services';

const { Text } = Typography;

export default function UserMenu() {
    const { user, loading } = useAuthContext();

    if (loading) {
        // 💡 KHẮC PHỤC 1: Chỉ cần căn giữa Spin (vì Header đã lo chiều cao)
        return (
            <div className="flex items-center justify-center">
                <Spin size="small" />
            </div>
        );
    }

    if (!user) return null;

    const avatarUrl = user.avatar || user.detail.avatar;
    const userPoints = user.detail.points;

    const menuItems: MenuProps['items'] = [
        // ... (Giữ nguyên menuItems)
        {
            key: 'info',
            label: (
                <div className="p-1 border-b border-gray-200 mb-2">
                    <Text strong>{user.full_name}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>{user.email}</Text>
                </div>
            ),
        },
        {
            key: 'profile',
            label: <Link href="/profile/images">Ảnh tải lên</Link>,
            icon: <ProfileOutlined />,
        },
        { type: 'divider' as const },
        {
            key: 'logout',
            label: <Text className="text-red-500 cursor-pointer">Đăng xuất</Text>,
            icon: <LogoutOutlined className="text-red-500" />,
            onClick: () => {
                Modal.confirm({
                    title: 'Xác nhận Đăng xuất',
                    content: 'Bạn có chắc chắn muốn đăng xuất không?',
                    okText: 'Có',
                    cancelText: 'Không',
                    onOk: () => authService.logout(),
                });
            },
        }
    ];

    return (
        <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
        >
            <div className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-colors">

                {/* Điểm người dùng */}
                <div className="hidden sm:flex items-center rounded-full bg-yellow-500/10 text-yellow-600 font-bold pl-3 pr-2 py-1 border border-yellow-300/50">
                    <FireOutlined className="mr-1 text-sm" />
                    <Text strong className="text-yellow-700 text-sm">
                        {userPoints.toLocaleString()}
                    </Text>
                </div>

                {/* Avatar */}
                <Avatar
                    src={avatarUrl}
                    size="default"
                    icon={<UserOutlined />}
                    alt={user.full_name}
                    className="shadow-md"
                />
            </div>
        </Dropdown>
    );
}