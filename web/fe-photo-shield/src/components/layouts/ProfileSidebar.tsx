// src/components/layouts/ProfileSidebar.tsx (ĐÃ CẬP NHẬT)
"use client";

import React from 'react';
import { Menu, MenuProps } from 'antd';
import { UploadOutlined, PictureOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
): MenuItem {
    return {
        key,
        icon,
        label,
    } as MenuItem;
}

const items: MenuItem[] = [
    getItem(<Link href="/profile">Thông tin chung</Link>, '/profile', <UserOutlined />),
    getItem(<Link href="/profile/settings">Cài đặt</Link>, '/profile/settings', <SettingOutlined />),
    getItem(<Link href="/profile/upload">Tải ảnh lên</Link>, '/profile/upload', <UploadOutlined />),
    getItem(<Link href="/profile/my-photos">Ảnh của bạn</Link>, '/profile/my-photos', <PictureOutlined />),
];

export default function ProfileSidebar() {
    const pathname = usePathname();

    // Lấy key đang active dựa trên URL hiện tại
    // Chuyển /profile/upload thành /profile/upload để khớp key
    const activeKey = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

    return (
        <div className="w-full lg:w-64" style={{ height: "100%" }}>
            {/* Tiêu đề được loại bỏ vì đã có trong Profile Layout */}

            <Menu
                mode="inline"
                // 💡 CẢI TIẾN: Thay đổi style Menu
                selectedKeys={[activeKey]}
                items={items}
                className="
                    w-full 
                    bg-white 
                    rounded-xl 
                    shadow-xl 
                    p-2 
                    text-base 
                    border-none 
                    overflow-hidden
                "
                style={{ height: "100%" }}
                // Loại bỏ border item và padding thừa của Antd
                theme="light"
            />
        </div>
    );
}