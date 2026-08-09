import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  AuthUser,
} from '@shared/api.interface';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterRequest): Promise<AuthResponse> {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginRequest): Promise<AuthResponse> {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Req() req: any): Promise<AuthUser> {
    return this.authService.findById(req.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(): Promise<{ success: boolean }> {
    return { success: true };
  }
}
