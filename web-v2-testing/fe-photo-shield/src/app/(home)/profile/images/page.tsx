// src/app/profile/upload/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    message,
    Space,
    Image,
    Tag,
    Popconfirm,
    Descriptions,
    Tooltip,
    Typography,
    Select,
    InputNumber
} from "antd";
import type { TableProps } from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    DownloadOutlined,
    CalendarOutlined,
} from "@ant-design/icons";

// Import Hooks & Context
import { useAuthContext } from "@/contexts/AuthContext";

// Import Services & Types
import {
    imageService,
    ImageItem,
    PaginationMeta,
    UpdateImagePayload
} from "@/services/imageService";

// Import Constants
import { IMAGE_CATEGORIES } from "@/lib/constant/category.constant"; // Giả định bạn đã tạo file này

const { Text } = Typography;

// Định nghĩa Base URL
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function MyImagePage() {
    const { user, isAuthenticated } = useAuthContext();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ImageItem[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta>({
        page: 1,
        size: 10,
        total: 0,
        totalPages: 0,
    });

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
    const [form] = Form.useForm();

    // Helper function để tạo full URL
    const getFullImageUrl = (imageName: string | undefined) => {
        if (!imageName) return "https://placehold.co/100?text=No+Image";
        // Nếu image_name đã là full url (bắt đầu http) thì giữ nguyên, ngược lại nối với BASE_URL
        if (imageName.startsWith('http')) return imageName;

        // Đảm bảo không bị double slash nếu BASE_URL có / ở cuối
        const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        const cleanPath = imageName.startsWith('/') ? imageName : `/${imageName}`;

        return `${cleanBaseUrl}${cleanPath}`;
    };

    const fetchImages = useCallback(async (page: number, size: number) => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const res = await imageService.getAll({
                page,
                size,
                userId: user.id,
                orderBy: 'createdAt',
                orderDirection: 'desc'
            });
            setData(res.data);
            setPagination(res.meta);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải danh sách ảnh.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchImages(pagination.page, pagination.size);
        }
    }, [isAuthenticated, user, fetchImages]);

    const handleDelete = async (id: number) => {
        try {
            await imageService.remove(id);
            message.success("Đã xóa ảnh thành công");
            fetchImages(pagination.page, pagination.size);
        } catch (error) {
            message.error("Xóa ảnh thất bại");
        }
    };

    const handleOpenEdit = (record: ImageItem) => {
        setEditingImage(record);
        // Chỉ set các field cho phép sửa
        form.setFieldsValue({
            caption: record.caption,
            category: record.category,
            points: record.points,
        });
        setEditModalOpen(true);
    };

    const handleUpdate = async (values: UpdateImagePayload) => {
        if (!editingImage) return;
        try {
            await imageService.update(editingImage.id, values);
            message.success("Cập nhật thông tin thành công");
            setEditModalOpen(false);
            fetchImages(pagination.page, pagination.size);
        } catch (error) {
            message.error("Cập nhật thất bại");
        }
    };

    const handleOpenView = (record: ImageItem) => {
        setSelectedImage(record);
        setViewModalOpen(true);
    };

    const handleTableChange: TableProps<ImageItem>['onChange'] = (newPagination) => {
        fetchImages(newPagination.current || 1, newPagination.pageSize || 10);
    };

    // Helper để lấy label category
    const getCategoryLabel = (value: string | undefined) => {
        if (!value) return 'Chưa phân loại';
        const cat = IMAGE_CATEGORIES.find(c => c.value === value);
        return cat ? cat.label : value;
    }

    const columns: TableProps<ImageItem>["columns"] = [
        {
            title: "Ảnh",
            dataIndex: "image_name", // Dùng image_name để tạo URL
            key: "image",
            width: 100,
            render: (name) => {
                const url = getFullImageUrl(name);
                return (
                    <div className="rounded-md overflow-hidden border border-gray-200 w-[80px] h-[60px] bg-gray-50 flex items-center justify-center">
                        <Image
                            src={url}
                            width={80}
                            height={60}
                            className="object-cover"
                            fallback="https://placehold.co/100?text=Error"
                        />
                    </div>
                )
            },
        },
        {
            title: "Thông tin",
            key: "info",
            render: (_, record) => (
                <div className="flex flex-col gap-1">
                    {/* Vẫn hiển thị tên ảnh ở đây để user biết là ảnh nào, nhưng không cho sửa */}
                    {/* <Text strong className="text-gray-800">{record.image_name}</Text> */}
                    {record.caption && (
                        <Tooltip title={record.caption}>
                            <Text className="text-gray-800" italic ellipsis={{ tooltip: true }} style={{ width: 200 }}>
                                {record.caption}
                            </Text>
                        </Tooltip>
                    )}
                </div>
            ),
        },
        {
            title: "Danh mục",
            dataIndex: "category",
            key: "category",
            width: 150,
            render: (cat) => {
                const label = getCategoryLabel(cat);
                return cat ? <Tag color="blue">{label}</Tag> : <Tag>Chưa phân loại</Tag>
            },
        },
        {
            title: "Điểm",
            dataIndex: "points",
            key: "points",
            width: 100,
            render: (points) => <span className="font-semibold text-green-600">+{points}</span>
        },
        {
            title: "Ngày tải lên",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 150,
            render: (date) => (
                <span className="text-gray-500 text-sm">
                    <CalendarOutlined className="mr-1" />
                    {new Date(date).toLocaleDateString("vi-VN")}
                </span>
            ),
        },
        {
            title: "Hành động",
            key: "action",
            width: 150,
            fixed: "right",
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button size="small" icon={<EyeOutlined />} onClick={() => handleOpenView(record)} />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa ảnh"
                        description="Bạn có chắc chắn muốn xóa ảnh này không?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (!isAuthenticated && !loading && !user) {
        return <div className="p-6">Vui lòng đăng nhập để xem danh sách ảnh.</div>;
    }

    return (
        <div className=" bg-white min-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold mb-4 text-blue-700">Quản lý ảnh</h1>

                </div>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: pagination.page,
                    pageSize: pagination.size,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} ảnh`,
                }}
                onChange={handleTableChange}
                scroll={{ x: 900 }}
            />

            {/* --- Modal 1: Cập nhật (Edit) --- */}
            <Modal
                title="Cập nhật thông tin ảnh"
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                    {/* Không hiển thị image_name để edit */}

                    <Form.Item name="category" label="Danh mục">
                        <Select
                            placeholder="Chọn danh mục"
                            options={IMAGE_CATEGORIES}
                            allowClear
                        />
                    </Form.Item>

                    <Form.Item name="points" label="Điểm (Points)">
                        <InputNumber min={0} className="w-full" placeholder="Nhập số điểm..." />
                    </Form.Item>

                    <Form.Item name="caption" label="Mô tả / Caption">
                        <Input placeholder="Nhập mô tả cho ảnh..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* --- Modal 2: Xem chi tiết (View Detail) --- */}
            <Modal
                title="Chi tiết hình ảnh"
                open={viewModalOpen}
                footer={[
                    <Button key="download" icon={<DownloadOutlined />} onClick={() => selectedImage && imageService.download(selectedImage.id)}>
                        Tải xuống
                    </Button>,
                    <Button key="close" type="primary" onClick={() => setViewModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
                onCancel={() => setViewModalOpen(false)}
                width={700}
            >
                {selectedImage && (
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex justify-center bg-gray-50 rounded border border-gray-100 items-center min-h-[200px]">
                            <Image
                                src={getFullImageUrl(selectedImage.image_name)}
                                alt={selectedImage.image_name}
                                className="max-h-[300px] object-contain"
                            />
                        </div>
                        <div className="flex-1">
                            <Descriptions column={1} bordered size="small">
                                {/* <Descriptions.Item label="Tên file">{selectedImage.image_name}</Descriptions.Item> */}
                                <Descriptions.Item label="Danh mục">
                                    {getCategoryLabel(selectedImage.category)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Điểm">{selectedImage.points}</Descriptions.Item>
                                <Descriptions.Item label="Ngày tạo">
                                    {new Date(selectedImage.createdAt).toLocaleString('vi-VN')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Mô tả">
                                    {selectedImage.caption || 'Không có mô tả'}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}