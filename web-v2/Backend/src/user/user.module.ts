// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
    imports: [
        MulterModule.register(), // Đăng ký module rỗng để dùng được FileInterceptor
    ],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule { }