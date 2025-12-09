// src/app/profile/upload/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Form, Input, Select, Button, message, Typography, Divider, Alert, Card, Image, Spin } from 'antd';
import { UploadOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, PictureOutlined, InboxOutlined } from '@ant-design/icons';
import { fileService, CheckImageResponse, UploadImageResponse } from '@/services';
import { imageService, CreateImagePayload } from '@/services';
import { IMAGE_CATEGORIES } from '@/lib/constant/category.constant';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ImageCheckModal from '@/components/ImageCheckModal';
import { LoadingDots } from '@/components/LoadingDots';

const { Dragger } = Upload;
const { Option } = Select;
const { Text } = Typography;

// Định nghĩa kiểu dữ liệu cho Form (metadata)
interface ImageMetadataForm {
    caption: string;
    points: number;
    category: string;
}

export default function UploadPage() {
    const [form] = Form.useForm<ImageMetadataForm>();
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [checkResult, setCheckResult] = useState<CheckImageResponse | null>(null);

    // 💡 State cho Modal chi tiết
    const [isModalVisible, setIsModalVisible] = useState(false);

    const [isChecking, setIsChecking] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const canUpload = useMemo(() => {
        return file && checkResult?.status === 'safe';
    }, [file, checkResult]);

    // Cleanup Effect cho Preview URL
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);


    // ===================================
    // LOGIC RESET TRẠNG THÁI
    // ===================================

    const resetState = () => {
        setFile(null);
        setCheckResult(null);
        form.resetFields();
    };


    /* ============================
       LOGIC BƯỚC 1: CHECK ẢNH (Kiểm tra Bản quyền)
    =============================== */

    const handleFileChange = async (info: any) => {
        const selectedFile = info.fileList[0]?.originFileObj;

        if (!selectedFile) {
            resetState();
            return;
        }

        setFile(selectedFile);
        setCheckResult(null);
        setIsChecking(true);

        try {
            const result = await fileService.checkImage(selectedFile);
            setCheckResult(result);

            if (result.status === 'unsafe') {
                message.error(`Kiểm tra Bản quyền Thất bại: ${result.message}`);
            } else {
                message.success('Ảnh Độc quyền! Bạn có thể thêm thông tin và chia sẻ.');
            }
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response?.status === 400 && error.response.data) {
                const responseData = error.response.data as CheckImageResponse;
                setCheckResult(responseData);
                message.error('Ảnh bị trùng bản quyền và không thể chia sẻ.');
            } else {
                message.error(error.response?.data?.message || 'Lỗi kết nối khi kiểm tra bản quyền.');
                setCheckResult({ status: 'unsafe', message: 'Lỗi hệ thống khi kiểm tra.' });
            }
        } finally {
            setIsChecking(false);
        }

        return false;
    };

    /* ============================
       LOGIC BƯỚC 2 & 3: UPLOAD VÀ CREATE (Chia sẻ)
    =============================== */

    const handleSubmit = async (values: ImageMetadataForm) => {
        if (!file || checkResult?.status !== 'safe') {
            message.error('Vui lòng kiểm tra và xác minh ảnh hợp lệ trước khi chia sẻ.');
            return;
        }

        setIsUploading(true);

        try {
            const uploadRes = await fileService.uploadImage(file);

            const createPayload: CreateImagePayload = {
                image_name: uploadRes.fileUrl,
                original_name: uploadRes.originalUrl,
                metadata_url: uploadRes.metaUrl,
                caption: values.caption,
                category: values.category,
                points: values.points,
            };

            await imageService.create(createPayload);
            message.success('Ảnh đã được chia sẻ và bảo vệ bản quyền thành công!');

            resetState();
            // message.info('Bạn có thể tải lên ảnh khác ngay bây giờ.');

        } catch (error: any) {
            message.error(error.response?.data?.message || 'Chia sẻ ảnh thất bại. Vui lòng thử lại.');
        } finally {
            setIsUploading(false);
        }
    };


    /* ============================
       RENDER
    =============================== */

    const renderCheckStatus = () => {
        if (isChecking) {
            // 💡 FIX 1: Hiển thị Spin và dấu ba chấm trong Alert
            return (
                <Alert
                    message={
                        // Sử dụng Flex để căn chỉnh nội dung
                        <div className="flex justify-between items-center w-full">
                            {/* Dấu chấm động */}
                            <Text>Đang xác minh bản quyền ảnh <LoadingDots /></Text>
                            {/* Spin ở cuối bên phải */}
                            <Spin size="small" />
                        </div>
                    }
                    type="info"
                    showIcon={false} // Quan trọng: Tắt icon Antd mặc định
                />
            );
        }

        if (checkResult) {
            if (checkResult.status === 'safe') {
                return (
                    <Alert
                        message="Ảnh của bạn hợp lệ"
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                    />
                );
            } else {
                // 💡 FIX 2: Hiển thị nút/text để mở Modal xem chi tiết
                return (
                    <Alert
                        message="Bản quyền ảnh không hợp lệ"
                        type="error"
                        showIcon
                        icon={<CloseCircleOutlined />}
                        action={
                            <Button
                                size="small"
                                danger
                                type="link"
                                onClick={() => setIsModalVisible(true)}
                                className='!py-0 !px-1'
                            >
                                Xem chi tiết
                            </Button>
                        }
                    />
                );
            }
        }
        return (
            <Alert
                message="Chọn ảnh để bắt đầu quy trình kiểm tra bản quyền."
                type="warning"
                showIcon
                icon={<InfoCircleOutlined />}
            />
        );
    };


    return (
        <>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="space-y-6"
                initialValues={{ points: 0, category: 'other' }}
            >
                <h1 className="text-xl font-semibold mb-4 text-blue-700">Chia sẻ Ảnh Mới</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Cột 1: UPLOAD VÀ STATUS */}
                    <div className="lg:col-span-2 space-y-4">

                        <Form.Item label="1. Tải File và Xác minh Bản quyền">
                            <Dragger
                                name="file"
                                multiple={false}
                                beforeUpload={() => false}
                                onChange={handleFileChange}
                                maxCount={1}
                                disabled={isChecking || isUploading}
                                className={checkResult?.status === 'unsafe' ? 'border-red-500' : ''}
                                fileList={file ? [{ uid: file.name, name: file.name, status: 'done' }] : []}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Kéo thả hoặc Nhấp để chọn ảnh</p>
                                <p className="ant-upload-hint">Chỉ chấp nhận một ảnh duy nhất cho mỗi lần chia sẻ.</p>
                            </Dragger>
                        </Form.Item>

                        {/* Hiển thị Trạng thái Kiểm tra (Alert) */}
                        {renderCheckStatus()}

                        {/* Form Metadata */}
                        <Divider orientation="left" orientationMargin="0" className="!mt-8 !mb-6 !ml-0">
                            <Text strong>2. Thông tin Ảnh</Text>
                        </Divider>

                        <Form.Item
                            label="Tên/Mô tả Ảnh"
                            name="caption"
                            rules={[{ required: true, message: "Vui lòng nhập tên/mô tả ảnh!" }]}
                        >
                            <Input placeholder="Ví dụ: Hoàng hôn trên biển Đà Nẵng" />
                        </Form.Item>

                        <Form.Item
                            label="Danh mục"
                            name="category"
                            rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
                        >
                            <Select placeholder="Chọn danh mục ảnh">
                                {IMAGE_CATEGORIES.map(cat => (
                                    <Option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* Nút Tải lên chính */}
                        <Divider />
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={isUploading}
                            disabled={!canUpload || isUploading}
                            className="w-full"
                        >
                            {isUploading ? 'Đang bảo vệ và chia sẻ...' : 'Chia sẻ Ảnh'}
                        </Button>

                    </div>

                    {/* Cột 3: IMAGE REVIEW VÀ POINTS */}
                    <div className="lg:col-span-1 space-y-4 pt-10">

                        {/* Điểm thu phí */}
                        <Card size="small" title="3. Điểm Thu Phí" className="shadow-md">
                            <Form.Item
                                name="points"
                                tooltip="Số điểm này người dùng khác phải trả khi tải về ảnh của bạn."
                                rules={[
                                    { required: true, message: "Vui lòng nhập điểm!" },
                                    { type: 'number', min: 0, max: 1000000, message: "Điểm phải từ 0 đến 1.0000.000" }
                                ]}
                                getValueFromEvent={(e) => {
                                    const value = e.target.value;
                                    return value === "" ? undefined : Number(value);
                                }}
                                className="!mb-0"
                            >
                                <Input type="number" defaultValue={0} placeholder="Mức phí (Tối thiểu 0)" min={0} max={1000000} />
                            </Form.Item>
                        </Card>

                        {/* Review Ảnh */}
                        <Card
                            title="Xem trước Ảnh"
                            className="shadow-md"
                            bordered={false}
                            bodyStyle={{ padding: 0 }}
                        >
                            {(previewUrl && (isChecking || checkResult?.status === "safe")) ? (
                                <div className="relative flex items-center justify-center p-2 bg-gray-100">
                                    {isChecking && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                                            <Spin tip="Đang kiểm tra..." size="small" />
                                        </div>
                                    )}
                                    <Image
                                        src={previewUrl!}
                                        alt="Image Preview"
                                        style={{ maxHeight: 250, objectFit: 'contain', width: '100%' }}
                                        preview={false}
                                    />

                                </div>
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-gray-500">
                                    <PictureOutlined style={{ fontSize: '32px' }} className="mb-2" />
                                    <Text type="secondary">Ảnh xem trước sẽ hiển thị ở đây</Text>
                                </div>
                            )}
                        </Card>

                    </div>
                </div>
            </Form>

            {/* 💡 MODAL XEM CHI TIẾT */}
            <ImageCheckModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                data={checkResult}
            />
        </>
    );
}