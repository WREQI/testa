import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }

    const token = authHeader.slice(7);
    const userId = this.authService.verifyToken(token);
    if (!userId) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    try {
      await this.authService.findById(userId);
    } catch {
      throw new UnauthorizedException('用户不存在或已失效，请重新登录');
    }

    req.userId = userId;
    return true;
  }
}
