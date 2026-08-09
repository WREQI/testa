import { AuthService } from './auth.service';
import type { RegisterRequest, LoginRequest, AuthResponse, AuthUser } from '@shared/api.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: RegisterRequest): Promise<AuthResponse>;
    login(body: LoginRequest): Promise<AuthResponse>;
    profile(req: any): Promise<AuthUser>;
    logout(): Promise<{
        success: boolean;
    }>;
}
