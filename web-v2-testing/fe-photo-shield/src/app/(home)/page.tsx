// src/app/(home)/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button, Typography, Tabs, message, Spin, Empty } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation'; // <--- 1. Import thêm hook Next.js
import { imageService, ImageItem, ImageListResponse } from '@/services';
import { CATEGORIES_FOR_DISCOVERY } from '@/lib/constant/category.constant';
import ImageCard from '@/components/ImageCard';
import ImageDetailModal from '@/components/ImageDetailModal';

const { TabPane } = Tabs;

const PAGE_SIZE = 14;

export default function HomePage() {
  const router = useRouter();             // <--- 2. Init router
  const searchParams = useSearchParams(); // <--- 3. Init searchParams

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // States cho Modal chi tiết ảnh
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const hasMore = currentPage < totalPages;

  // ===================================
  // LOGIC CHECK URL PARAM (MỚI)
  // ===================================
  useEffect(() => {
    // Lấy param 'imageId' từ URL
    const imageIdParam = searchParams.get('imageId');

    if (imageIdParam) {
      const id = Number(imageIdParam);
      // Nếu id hợp lệ và khác với id đang chọn hiện tại
      if (!isNaN(id) && id !== selectedImageId) {
        setSelectedImageId(id);
        setIsDetailModalVisible(true);
      }
    } else {
      // Nếu không có param (người dùng xóa trên url hoặc back lại), đóng modal
      if (isDetailModalVisible) {
        setIsDetailModalVisible(false);
        setSelectedImageId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ===================================
  // LOGIC FETCH DỮ LIỆU
  // ===================================

  const fetchImages = async (page: number, category: string, isNewCategory = false) => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        category: category === 'all' ? undefined : category,
        orderBy: 'createdAt',
        orderDirection: 'desc' as 'desc'
      };

      const response: ImageListResponse = await imageService.getAll(params);

      setImages((prevImages) => {
        if (isNewCategory) {
          return response.data;
        }
        return [...prevImages, ...response.data];
      });

      setTotalPages(response.meta.totalPages);
      setCurrentPage(response.meta.page);

    } catch (error) {
      message.error('Không thể tải danh sách ảnh. Vui lòng thử lại.');
      console.error('Fetch images error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===================================
  // EFFECTS & HANDLERS
  // ===================================

  useEffect(() => {
    fetchImages(1, selectedCategory, true);
  }, [selectedCategory]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchImages(currentPage + 1, selectedCategory);
    }
  };

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
  };

  // 4. Handler mở Modal chi tiết (Cập nhật để thêm query param vào URL)
  const handleOpenModal = (image: ImageItem) => {
    setSelectedImageId(image.id);
    setIsDetailModalVisible(true);

    // Thêm ?imageId=... vào URL mà không reload trang
    router.push(`/?imageId=${image.id}`, { scroll: false });
  };

  // 5. Handler đóng Modal (Cập nhật để xóa query param khỏi URL)
  const handleCloseModal = () => {
    setIsDetailModalVisible(false);
    setSelectedImageId(null);

    // Xóa query param quay về trang gốc
    router.push('/', { scroll: false });
  };


  // ===================================
  // RENDER
  // ===================================

  const renderImageList = () => {
    if (!loading && images.length === 0) {
      const currentLabel = CATEGORIES_FOR_DISCOVERY.find(c => c.value === selectedCategory)?.label || 'đang chọn';
      return (
        <div className="py-20">
          <Empty description={`Hiện chưa có ảnh nào thuộc danh mục "${currentLabel}".`} />
        </div>
      );
    }

    return (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-6">
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            onOpenModal={handleOpenModal}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="py-4 min-h-screen">

      {/* Header / Tabs */}
      <div className="mb-4">
        <Tabs
          defaultActiveKey="all"
          onChange={handleCategoryChange}
          className="w-full"
          centered
        >
          {CATEGORIES_FOR_DISCOVERY.map(cat => (
            <TabPane tab={cat.label} key={cat.value} />
          ))}
        </Tabs>
      </div>

      {/* Image List (Masonry Grid) */}
      {renderImageList()}

      {/* Load More Button / Loading State */}
      <div className="flex justify-center mt-12 mb-8">
        {loading && images.length === 0 ? (
          <Spin size="default" tip="Đang tải ảnh..." />
        ) : (
          <>
            {hasMore && (
              <Button
                type="primary"
                size="large"
                onClick={handleLoadMore}
                loading={loading}
                disabled={loading}
                className="px-10"
              >
                {loading ? 'Đang tải...' : 'Tải thêm'}
              </Button>
            )}
            {!hasMore && images.length > 0 && !loading && (
              <></>
            )}
          </>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT ẢNH */}
      <ImageDetailModal
        visible={isDetailModalVisible}
        onClose={handleCloseModal}
        imageId={selectedImageId}
      />
    </div>
  );
}