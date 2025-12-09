// components/ImageDetailModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
    Modal,
    Button,
    Typography,
    Tag,
    Avatar,
    Space,
    message,
    Spin // Import Spin để hiển thị loading
} from 'antd';
import {
    DownloadOutlined,
    UserOutlined,
    CalendarOutlined,
    FolderOpenOutlined,
    FireOutlined,
    CheckCircleOutlined,
    EyeOutlined
} from '@ant-design/icons';

import { ImageItem, imageService } from '@/services';
import { IMAGE_CATEGORIES } from '@/lib/constant/category.constant';
import ProtectedImage from './ProtectedImage';
import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const { Text, Title } = Typography;

interface ImageDetailModalProps {
    visible: boolean;
    onClose: () => void;
    imageId: number | null; // CHỈ TRUYỀN ID
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({ visible, onClose, imageId }) => {
    const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const { isAuthenticated, refreshUser } = useAuthContext();
    const router = useRouter();
    // State lưu chi tiết ảnh lấy từ API
    const [image, setImage] = useState<ImageItem | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false); // Loading khi getById
    const [isDownloading, setIsDownloading] = useState(false); // Loading khi download

    // --- EFFECT: Fetch dữ liệu khi mở Modal ---
    useEffect(() => {
        if (visible && imageId) {
            fetchImageDetail(imageId); // Mặc định isRefresh = false -> Hiện loading
        } else {
            setImage(null);
        }
    }, [visible, imageId]);

    // Sửa lại dòng khai báo hàm
    const fetchImageDetail = async (id: number, isRefresh = false) => {
        try {
            // Chỉ hiện loading spinner nếu KHÔNG PHẢI là làm mới ngầm
            if (!isRefresh) {
                setIsLoadingData(true);
            }

            const data = await imageService.getById(id);
            setImage(data);
        } catch (error) {
            console.error("Failed to fetch image detail:", error);
            message.error("Không thể tải thông tin ảnh.");
            onClose();
        } finally {
            // Chỉ tắt loading nếu trước đó đã bật
            if (!isRefresh) {
                setIsLoadingData(false);
            }
        }
    };

    // --- Nếu đang loading hoặc chưa có dữ liệu thì hiện Spin hoặc null ---
    if (!visible) return null;

    // Loading State UI
    if (isLoadingData || !image) {
        return (
            <Modal
                open={visible}
                onCancel={onClose}
                footer={null}
                width={750}
                centered
                closable={false}
            >
                <div className="h-[300px] flex justify-center items-center">
                    <Spin size="large" tip="Đang tải thông tin..." />
                </div>
            </Modal>
        );
    }

    // --- DATA READY ---
    const imageUrl = BASE_URL + image.image_name;

    // Avatar User
    const userAvatar = image.user?.detail?.avatar
        ? (image.user.detail.avatar.startsWith('http') ? image.user.detail.avatar : `${BASE_URL}/${image.user.detail.avatar}`)
        : null;

    const categoryLabel = IMAGE_CATEGORIES.find(c => c.value === image.category)?.label || image.category || "Chưa phân loại";
    const isFree = image.points === 0;

    // Tính số lượt tải
    const downloadCount = image.downloadedBy?.length || 0;

    // --- Hàm xử lý download ---
    const handleDownload = async () => {
        if (!isAuthenticated) {
            message.warning("Bạn cần đăng nhập để tải ảnh!");
            router.push("/auth/login");
            return;
        }
        if (!image) return;

        try {
            setIsDownloading(true);
            const response = await imageService.download(image.id);
            const rawPath = response.image_name || response.downloadUrl;

            if (!rawPath) {
                message.error("Không tìm thấy đường dẫn tải về.");
                return;
            }

            const cleanFileName = rawPath.split('/').pop() || 'image-download.jpg';
            const downloadUrl = `${BASE_URL}${rawPath}`;

            const res = await fetch(downloadUrl);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', cleanFileName);
            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(blobUrl);

            message.success(response.message || 'Tải ảnh thành công!');

            // Refetch lại để cập nhật số lượt tải mới ngay lập tức
            refreshUser();
            fetchImageDetail(image.id, true);

        } catch (error: any) {
            console.error("Download error:", error);
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh.';
            message.error(errorMsg);
        } finally {
            setIsDownloading(false);
        }
    };

    // --- Custom Title Component (Header) ---
    const renderTitle = () => (
        <div className="flex justify-between items-center w-full pr-8">
            {/* Left: User Info */}
            <div className="flex items-center gap-3">
                <Avatar
                    src={userAvatar}
                    icon={<UserOutlined />}
                    size={40}
                    className="!border !border-gray-200 shadow-sm flex-shrink-0"
                />
                <div className="flex flex-col justify-center">
                    <Text strong className="text-[15px] leading-tight text-gray-800">
                        {image.user?.full_name || 'Người dùng ẩn danh'}
                    </Text>
                    <Text type="secondary" className="text-xs mt-0.5">
                        {image.user?.email || 'Thành viên đóng góp'}
                    </Text>
                </div>
            </div>

            {/* Right: Download Button */}
            <Button
                type="primary"
                shape="round"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={isDownloading}
                disabled={isDownloading}
                className={`
                    flex items-center gap-1 font-semibold border-none shadow-md hover:shadow-lg
                    transform transition-all duration-300 hover:-translate-y-0.5
                    ${isFree
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                    }
                `}
            >
                {!isDownloading && (isFree ? 'Tải Miễn Phí' : `Tải Ngay (-${image.points})`)}
                {isDownloading && 'Đang xử lý...'}
            </Button>
        </div>
    );

    return (
        <Modal
            title={renderTitle()}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={750}
            centered
            className="image-detail-modal"
            style={{ top: 5 }}
            styles={{
                body: { padding: 0, paddingBottom: 6 },
                header: { paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }
            }}
        >
            {/* --- Hero Image Section (Protected) --- */}
            <div className=" flex justify-center items-center p-3 border-b border-gray-200 min-h-[350px]">
                <ProtectedImage
                    src={imageUrl}
                    alt={image.caption}
                    wrapperClassName="flex justify-center items-center shadow-lg rounded-lg overflow-hidden bg-white"
                    style={{
                        maxHeight: '450px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        display: 'block'
                    }}
                />
            </div>

            {/* --- Content Section --- */}
            <div className="px-8 pt-3">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-2">
                    <div className="flex-1">
                        <Title level={4} className="!mb-2 !mt-0 text-gray-800">
                            {image.caption || image.original_name || "Hình ảnh không tên"}
                        </Title>

                        <Space size={[0, 8]} wrap className="mb-3">
                            <Tag color="cyan" className="px-2 py-0.5 text-sm flex items-center gap-1 border-0 bg-cyan-50 text-cyan-700">
                                <FolderOpenOutlined /> {categoryLabel}
                            </Tag>

                            <Tag className="px-2 py-0.5 text-sm flex items-center gap-1 border border-gray-200 bg-white text-gray-500">
                                <CalendarOutlined /> {new Date(image.createdAt).toLocaleDateString('vi-VN')}
                            </Tag>

                            {/* --- MỚI: Hiển thị số lượt tải --- */}
                            <Tag className="px-2 py-0.5 text-sm flex items-center gap-1 border border-blue-200 bg-blue-50 text-blue-600">
                                <EyeOutlined /> {downloadCount} lượt tải
                            </Tag>
                        </Space>
                    </div>

                    <div className="flex-shrink-0">
                        {isFree ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-lg bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                                <CheckCircleOutlined />
                                <span>Miễn phí</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-orange-500 font-bold text-lg bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100 shadow-sm">
                                <FireOutlined />
                                <span>{image.points} Point</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ImageDetailModal;