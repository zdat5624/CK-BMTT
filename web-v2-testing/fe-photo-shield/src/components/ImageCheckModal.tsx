// src/components/ImageCheckModal.tsx
import React from 'react';
import {
    Modal,
    Button,
    Typography,
    Progress,
    Tag,
} from 'antd';
import {
    CheckCircleFilled,
    CloseCircleFilled,
    ArrowRightOutlined,
    SafetyCertificateOutlined,
    BarcodeOutlined
} from '@ant-design/icons';
import { CheckImageResponse } from '@/services';
import ProtectedImage from './ProtectedImage'; // Import component vừa tạo

const { Title, Text, Paragraph } = Typography;
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface ImageCheckModalProps {
    visible: boolean;
    onClose: () => void;
    data: CheckImageResponse | null;
}

const ImageCheckModal: React.FC<ImageCheckModalProps> = ({ visible, onClose, data }) => {
    if (!data) return null;

    const isSafe = data.status === 'safe';
    const score = data.score ?? 0;
    const percent = Math.round(score * 100);

    const getFullImageUrl = (imageName: string | undefined) => {
        if (!imageName) return "https://placehold.co/400?text=No+Image";
        if (imageName.startsWith('http')) return imageName;
        const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        const cleanPath = imageName.startsWith('/') ? imageName : `/${imageName}`;
        return `${cleanBaseUrl}${cleanPath}`;
    };

    const conflictImageUrl = getFullImageUrl(data.copyrighted_image_name);
    const statusColor = isSafe ? '#52c41a' : '#ff4d4f';
    const statusIcon = isSafe ? <CheckCircleFilled /> : <CloseCircleFilled />;
    const statusText = isSafe ? 'Hợp lệ & Độc quyền' : 'Phát hiện Trùng lặp';

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={750}
            centered
            className="rounded-2xl overflow-hidden"
            styles={{ body: { padding: 0 } }}
            closeIcon={true}
        >
            <div className="flex flex-col md:flex-row min-h-[420px]">
                {/* --- CỘT TRÁI (Giữ nguyên) --- */}
                <div
                    className="md:w-5/12 px-6 flex flex-col items-center justify-center text-center relative"
                    style={{ backgroundColor: isSafe ? '#f6ffed' : '#fff1f0', borderRight: '1px solid #f0f0f0' }}
                >
                    <Title level={5} style={{ marginBottom: 24, color: '#595959', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Mức độ tương đồng
                    </Title>
                    <div className="transform scale-110 mb-6 transition-all duration-500 hover:scale-125">
                        <Progress
                            type="circle"
                            percent={percent - 1.5}
                            width={150}
                            strokeColor={statusColor}
                            strokeWidth={10}
                            trailColor={isSafe ? '#d9f7be' : '#ffa39e'}
                            format={(percent) => (
                                <div className="flex flex-col items-center select-none">
                                    {percent && (
                                        <span style={{ fontSize: 36, fontWeight: '800', color: statusColor }}>{percent + 1.5}%</span>
                                    )}
                                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>MATCH RATE</span>
                                </div>
                            )}
                        />
                    </div>
                    <Tag color={isSafe ? 'success' : 'error'} style={{ padding: '6px 16px', fontSize: '14px', borderRadius: 20 }} icon={statusIcon}>
                        {isSafe ? 'Safe Content' : 'Copyright Alert'}
                    </Tag>
                </div>

                {/* --- CỘT PHẢI --- */}
                <div className="md:w-7/12 px-6 flex flex-col bg-white">
                    <div className="flex-1">
                        <div className="mb-4">
                            <Text type="secondary" className="uppercase text-[10px] font-bold tracking-widest text-gray-400">
                                KẾT QUẢ PHÂN TÍCH
                            </Text>
                            <Title level={3} style={{ marginTop: 2, marginBottom: 4, color: isSafe ? '#389e0d' : '#cf1322' }}>
                                {statusText}
                            </Title>
                            <Paragraph type="secondary" className="text-sm text-gray-500 mb-0">
                                {isSafe
                                    ? "Hình ảnh không trùng lặp với bất kỳ dữ liệu nào đã được bảo vệ."
                                    : "Hệ thống phát hiện hình ảnh có độ tương đồng cao với tác phẩm dưới đây."
                                }
                            </Paragraph>
                        </div>

                        {!isSafe && (
                            <div className="relative w-full h-48 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden group mb-4 shadow-inner">
                                {data.copyrighted_image_id && (
                                    <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-mono font-bold text-gray-600 shadow-sm flex items-center gap-1">
                                        <BarcodeOutlined /> ID: #{data.copyrighted_image_id}
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 z-20 bg-red-500/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                                    ORIGINAL
                                </div>

                                {/* Sử dụng ProtectedImage thay cho Image */}
                                <ProtectedImage
                                    src={conflictImageUrl}
                                    alt="Copyrighted Content"
                                    height="100%"
                                    width="100%"
                                    wrapperClassName="w-full h-full flex justify-center items-center"
                                    className="object-contain p-2 mix-blend-multiply drop-shadow-xl hover:drop-shadow-2xl transition-all duration-300"
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                        )}

                        {isSafe && (
                            <div className="flex items-center justify-center bg-green-50 rounded-xl border border-green-100 border-dashed mb-4 min-h-[150px]">
                                <div className="text-center">
                                    <SafetyCertificateOutlined style={{ fontSize: 48, color: '#52c41a', opacity: 0.5 }} />
                                    <div className="text-green-600 text-xs mt-2 font-medium">Verified Safe</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end border-t border-gray-100 mt-2">
                        {!isSafe && (
                            <Button
                                type="primary"
                                danger
                                size="middle"
                                icon={<ArrowRightOutlined />}
                                href={`/?imageId=${data.copyrighted_image_id}`}
                                target="_blank"
                                className="shadow-md shadow-red-200 font-semibold px-6 hover:scale-105 transition-transform"
                            >
                                Xem ảnh gốc
                            </Button>
                        )}
                        {isSafe && (
                            <Button onClick={onClose} size="large" type="text" className="text-gray-500 hover:text-gray-700">
                                Đóng
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ImageCheckModal;