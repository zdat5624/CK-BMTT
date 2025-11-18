import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'public'), // Điều chỉnh rootPath
    // }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'uploads'),
    //   serveRoot: '/uploads',
    // }),
    AuthModule,
    UserModule,
  ],
})
export class AppModule { }
