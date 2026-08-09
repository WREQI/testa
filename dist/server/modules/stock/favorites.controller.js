"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoritesController = void 0;
const tslib_1 = require("tslib");
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const favorites_service_1 = require("./favorites.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let FavoritesController = class FavoritesController {
    favoritesService;
    constructor(favoritesService) {
        this.favoritesService = favoritesService;
    }
    async list(req) {
        return this.favoritesService.list(req.userId);
    }
    async add(req, body) {
        if (!body.stockCode || !body.stockName) {
            throw new common_1.BadRequestException('股票代码和名称不能为空');
        }
        return this.favoritesService.add(req.userId, body.stockCode, body.stockName);
    }
    async remove(req, code) {
        if (!code) {
            throw new common_1.BadRequestException('股票代码不能为空');
        }
        await this.favoritesService.remove(req.userId, code);
        return { success: true };
    }
    async check(req, code) {
        const isFavorite = await this.favoritesService.check(req.userId, code);
        return { isFavorite };
    }
};
exports.FavoritesController = FavoritesController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], FavoritesController.prototype, "list", null);
tslib_1.__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Object }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], FavoritesController.prototype, "add", null);
tslib_1.__decorate([
    (0, common_1.Delete)(':code'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('code')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", Promise)
], FavoritesController.prototype, "remove", null);
tslib_1.__decorate([
    (0, common_1.Get)('check/:code'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('code')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", Promise)
], FavoritesController.prototype, "check", null);
exports.FavoritesController = FavoritesController = tslib_1.__decorate([
    (0, common_1.Controller)('api/favorites'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    tslib_1.__metadata("design:paramtypes", [favorites_service_1.FavoritesService])
], FavoritesController);
