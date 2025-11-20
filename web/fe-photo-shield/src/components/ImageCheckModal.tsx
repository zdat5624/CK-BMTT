
// src/components/ImageCheckModal.tsx
import React from 'react';
import { Button, Divider, Modal, Typography } from 'antd';
import { CheckImageResponse } from '@/services';

const { Text, Paragraph } = Typography;

interface ImageCheckModalProps {
    visible: boolean;
    onClose: () => void;
    data: CheckImageResponse | null;
}

const ImageCheckModal: React.FC<ImageCheckModalProps> = ({ visible, onClose, data }) => {
    if (!data) return null;

    return (
        <Modal
            title="Chi tiết Xác minh Bản quyền"
            visible={visible}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>,
            ]}
        >
            <Paragraph>
                <Text strong>Trạng thái: </Text>
                <Text type={data.status === 'safe' ? 'success' : 'danger'}>
                    {data.status === 'safe' ? 'Ảnh Độc quyền' : 'Ảnh Không hợp lệ'}
                </Text>
            </Paragraph>
            <Paragraph>
                <Text strong>Thông báo hệ thống: </Text>
                {data.message || 'Không có thông báo chi tiết.'}
            </Paragraph>

            {(data.copyrighted_image_name || data.copyrighted_image_id) && (
                <>
                    <Divider />
                    <Paragraph>
                        <Text strong>Nguyên nhân trùng lặp:</Text>
                        <ul style={{ paddingLeft: 20 }}>
                            {data.copyrighted_image_name && (
                                <li>
                                    <Text type="danger">Trùng với file: {data.copyrighted_image_name}</Text>
                                </li>
                            )}
                            {data.copyrighted_image_id && (
                                <li>
                                    <Text type="danger">ID ảnh đã đăng ký: {data.copyrighted_image_id}</Text>
                                </li>
                            )}
                            {data.score !== undefined && data.score !== null && (
                                <li>
                                    <Text type="secondary">Mức độ trùng lặp (Score): {(data.score * 100).toFixed(2)}%</Text>
                                </li>
                            )}
                        </ul>
                    </Paragraph>
                </>
            )}
        </Modal>
    );
};

export default ImageCheckModal;