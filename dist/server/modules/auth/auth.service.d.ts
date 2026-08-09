import { type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import type { AuthUser, AuthResponse, RegisterRequest, LoginRequest } from '@shared/api.interface';
export declare class AuthService {
    private readonly db;
    constructor(db: PostgresJsDatabase);
    register(dto: RegisterRequest): Promise<AuthResponse>;
    login(dto: LoginRequest): Promise<AuthResponse>;
    findById(userId: string): Promise<AuthUser>;
    private signToken;
    verifyToken(token: string): string | null;
    private toUserDto;
}
