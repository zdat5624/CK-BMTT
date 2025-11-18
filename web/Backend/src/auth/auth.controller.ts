import { Body, Controller, Get, ParseBoolPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { authAssignRoleDto, authChangePasswordDto, authForgetPasswordDto, authLoginDto, authSignUpDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorator';
import * as client from '@prisma/client';
import { Role } from './decorator/role.decorator';
import { RolesGuard } from './strategy/role.strategy';

@Controller('auth')
export class AuthController {
    constructor(private authservice: AuthService) { }
    @Post('login')
    login(@Body() dto: authLoginDto) {
        return this.authservice.login(dto);
    }

    @Post('signup')
    singup(@Body() dto: authSignUpDto) {
        return this.authservice.signup(dto);
    }



}
