"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
let JwtAuthGuard = class JwtAuthGuard {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('请先登录');
        }
        const token = authHeader.slice(7);
        const userId = this.authService.verifyToken(token);
        if (!userId) {
            throw new common_1.UnauthorizedException('登录已过期，请重新登录');
        }
        req.userId = userId;
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [auth_service_1.AuthService])
], JwtAuthGuard);
