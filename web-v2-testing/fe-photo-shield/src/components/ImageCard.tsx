"use client";

import React from 'react';
import { Avatar, Button, Typography, Tooltip } from 'antd';
import { DownloadOutlined, UserOutlined } from '@ant-design/icons';
import { ImageItem } from '@/services';

const { Text } = Typography;

interface ImageCardProps {
    image: ImageItem;
    onOpenModal: (image: ImageItem) => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function ImageCard({ image, onOpenModal }: ImageCardProps) {
    const imageUrl = BASE_URL + image.image_name;

    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onOpenModal(image);
    };

    return (
        <div
            className="group relativebreak-inside-avoid  rounded-lg overflow-hidden 
                bg-gray-100 
                leading-none 
                transition duration-300 cursor-pointer

      
                shadow-[0_2px_6px_rgba(0,0,0,0.18)]
                hover:shadow-[0_3px_10px_rgba(0,0,0,0.22)]

                 "
            onClick={handleCardClick}
        >
            {/* Ảnh */}
            <div className="relative">
                <img
                    src={imageUrl}
                    alt={image.caption || image.original_name}
                    className="w-full h-auto object-cover block"
                />

                {/* Overlay mờ khi hover */}
                <div className="
                    absolute inset-0 
                    bg-black/20 
                    opacity-0 
                    group-hover:opacity-100 
                    transition-opacity duration-300 
                " />

                {/* -------------------- NỘI DUNG HIỆN KHI HOVER -------------------- */}



                {/* Góc dưới trái: Avatar + User */}
                <div
                    className="
                        absolute bottom-3 left-3 flex items-center gap-2
                        opacity-0 group-hover:opacity-100
                        transition duration-300
                        z-20

                      
                    "
                >
                    <Avatar
                        size="small"
                        style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                        icon={<UserOutlined style={{ color: "white" }} />}
                        src={`${BASE_URL}/${image.user?.detail?.avatar}`}
                    />

                    <Text
                        style={{ color: "white" }}
                        className="text-sm font-medium"
                    >
                        {image.user?.full_name || "Người dùng ẩn danh"}
                    </Text>
                </div>


                {/* Góc dưới phải: Nút tải xuống dạng capsule */}
                <div
                    className="
                        absolute bottom-3 right-3
                        opacity-0 group-hover:opacity-100
                        transition duration-300
                        z-20

                        bg-white/50
                        px-2 py-1 
                        rounded-full shadow
                       
                    "
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            alert(`Đang chuẩn bị tải ảnh ID: ${image.id}`);
                        }}
                        className="
                            py-1 
                            flex items-center gap-2
                            font-medium text-gray-800  cursor-pointer
                        "
                        style={{ color: "white" }}

                    >
                        <DownloadOutlined />
                        Tải xuống
                    </button>
                </div>

            </div>
        </div>
    );
}
