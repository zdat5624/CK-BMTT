// src/user/user.controller.ts
import {
    Body,
    Controller,
    Patch,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    ParseFilePipe,
    MaxFileSizeValidator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../auth/decorator';
import { EditUserDto } from './dto/edit-user.dto';
import { UserService } from './user.service';
import type { User } from '@prisma/client';
import { avatarStorageConfig, imageFileFilter } from 'src/configs/multer.config';

// Import config bạn vừa tạo

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
    constructor(private userService: UserService) { }

    // 1. Cập nhật thông tin (Code cũ)
    @Patch('info')
    editUser(@GetUser() user: User, @Body() dto: EditUserDto) {
        return this.userService.editUser(user.id, dto);
    }

    // 2. Cập nhật Avatar (Sử dụng config mới)
    @Post('avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: avatarStorageConfig,
        fileFilter: imageFileFilter,
    }))
    uploadAvatar(
        @GetUser() user: User,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        // file.filename chỉ là "avatar-170....jpg"

        // ✅ SỬA: Cộng thêm đường dẫn tương đối vào đây
        // Lưu ý: Không cần chữ "public/" vì static folder thường mount từ public
        const filePath = `uploads/avatars/${file.filename}`;

        return this.userService.updateAvatar(user.id, filePath);
    }
}