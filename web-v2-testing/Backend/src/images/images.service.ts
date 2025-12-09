import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PaginationDto } from './dto/request-image.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImagesService {
    constructor(private prisma: PrismaService) { }

    // 1. Tạo ảnh mới
    async create(userId: number, dto: CreateImageDto) {
        return this.prisma.image.create({
            data: {
                image_name: dto.image_name,
                original_name: dto.original_name,
                metadata_path: dto.metadata_url,
                caption: dto.caption,
                category: dto.category,
                points: dto.points || 0,
                userId,
            },
        });
    }

    // 2. Lấy danh sách ảnh
    async findAll(dto: PaginationDto) {
        const { page, size, search, userId, orderBy = "id", orderDirection, category } = dto;

        // 1. Xây dựng điều kiện lọc (Where)
        const whereCondition: Prisma.ImageWhereInput = {
            // Nếu có userId thì thêm vào điều kiện (AND implicit)
            ...(userId ? { userId: userId } : {}),
            ...(category ? { category: category } : {}),
            // Nếu có từ khóa search thì thêm điều kiện OR
            ...(search ? {
                OR: [
                    { image_name: { contains: search, mode: 'insensitive' } },
                    { caption: { contains: search, mode: 'insensitive' } },
                ],
            } : {}),
        };

        // 2. Chạy song song: Lấy data và Đếm tổng số
        const [items, total] = await this.prisma.$transaction([
            this.prisma.image.findMany({
                skip: (page - 1) * size,
                take: size,
                where: whereCondition,
                orderBy: {
                    [orderBy]: orderDirection,
                },
                include: {
                    user: {
                        include: {
                            detail: true
                        }
                    },
                },
            }),
            this.prisma.image.count({ where: whereCondition }),
        ]);

        // 3. Tính toán số trang và trả về
        const totalPages = Math.ceil(total / size);

        return {
            data: items,
            meta: {
                page,
                size,
                total,
                totalPages,
            },
        };
    }

    // 3. Lấy chi tiết 1 ảnh
    async findOne(id: number) {
        const image = await this.prisma.image.findUnique({
            where: { id },
            include: {
                user: { include: { detail: true } },
                downloadedBy: true,
            },
        });

        if (!image) {
            throw new NotFoundException('Ảnh không tồn tại');
        }

        return image;
    }


    async downloadImage(userId: number, imageId: number) {
        // 1. Lấy ảnh
        const image = await this.prisma.image.findUnique({
            where: { id: imageId },
            include: { user: true },
        });

        if (!image) throw new NotFoundException('Ảnh không tồn tại');

        // 2. Chủ sở hữu thì không trừ điểm (Logic cũ)
        if (image.userId === userId) {
            return {
                message: 'Owner tải ảnh — không trừ điểm',
                downloadUrl: image.image_name, // Sử dụng image_name để tạo link
            };
        }

        // 3. Kiểm tra user đã tải trước đó chưa (Logic cũ)
        const existed = await this.prisma.userDownloadedImage.findUnique({
            where: {
                userId_imageId: { userId, imageId },
            },
        });

        if (existed) {
            return {
                message: 'Bạn đã tải ảnh này trước đó — không trừ điểm nữa',
                downloadUrl: image.image_name,
            };
        }

        // 4. Lấy điểm user hiện tại (người tải)
        const userDetail = await this.prisma.userDetail.findUnique({
            where: { userId },
        });

        if (!userDetail) throw new NotFoundException('User không tồn tại');

        if (userDetail.points < image.points) {
            throw new BadRequestException('Bạn không đủ điểm để tải ảnh này');
        }

        // ==========================================================
        // 5. THỰC HIỆN GIAO DỊCH: TRỪ ĐIỂM NGƯỜI MUA - CỘNG ĐIỂM NGƯỜI BÁN - LƯU LỊCH SỬ
        // ==========================================================
        await this.prisma.$transaction([
            // A. Trừ điểm người tải (Downloader)
            this.prisma.userDetail.update({
                where: { userId },
                data: {
                    points: { decrement: image.points },
                },
            }),

            // B. Cộng điểm cho chủ sở hữu ảnh (Owner) - LOGIC MỚI THÊM
            this.prisma.userDetail.update({
                where: { userId: image.userId }, // ID của chủ ảnh
                data: {
                    points: { increment: image.points }, // Cộng thêm số điểm tương ứng
                },
            }),

            // C. Lưu lịch sử tải
            this.prisma.userDownloadedImage.create({
                data: {
                    userId,
                    imageId,
                },
            }),
        ]);

        return {
            message: 'Tải ảnh thành công',
            image_name: image.image_name,
            pointsSpent: image.points,
        };
    }


    // 5. Cập nhật (Chỉ owner)
    async update(id: number, userId: number, dto: UpdateImageDto) {
        const image = await this.prisma.image.findUnique({
            where: { id },
        });

        if (!image) throw new NotFoundException('Ảnh không tồn tại');

        if (image.userId !== userId) {
            throw new ForbiddenException('Bạn không phải chủ sở hữu ảnh này');
        }

        return this.prisma.image.update({
            where: { id },
            data: dto,
        });
    }


    async remove(id: number, userId: number) {
        const image = await this.prisma.image.findUnique({
            where: { id },
        });

        if (!image) throw new NotFoundException('Ảnh không tồn tại');

        if (image.userId !== userId) {
            throw new ForbiddenException('Bạn không có quyền xóa ảnh này');
        }

        // Dùng transaction để xóa dữ liệu liên quan trước
        await this.prisma.$transaction([
            // 1. Xóa lịch sử tải xuống
            this.prisma.userDownloadedImage.deleteMany({
                where: { imageId: id }
            }),
            // 2. Xóa ảnh
            this.prisma.image.delete({ where: { id } })
        ]);

        return { message: 'Xóa ảnh thành công' };
    }

}