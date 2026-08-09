"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingController = void 0;
const tslib_1 = require("tslib");
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const trading_service_1 = require("./trading.service");
let TradingController = class TradingController {
    tradingService;
    constructor(tradingService) {
        this.tradingService = tradingService;
    }
    async account(req) {
        return this.tradingService.getAccount(req.userId);
    }
    async positions(req) {
        return this.tradingService.getPositions(req.userId);
    }
    async orders(req) {
        return this.tradingService.getOrders(req.userId);
    }
    async trade(req, body) {
        return this.tradingService.trade(req.userId, body);
    }
};
exports.TradingController = TradingController;
tslib_1.__decorate([
    (0, common_1.Get)('account'),
    openapi.ApiResponse({ status: 200, type: Object }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], TradingController.prototype, "account", null);
tslib_1.__decorate([
    (0, common_1.Get)('positions'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], TradingController.prototype, "positions", null);
tslib_1.__decorate([
    (0, common_1.Get)('orders'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], TradingController.prototype, "orders", null);
tslib_1.__decorate([
    (0, common_1.Post)('trade'),
    openapi.ApiResponse({ status: 201, type: Object }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], TradingController.prototype, "trade", null);
exports.TradingController = TradingController = tslib_1.__decorate([
    (0, common_1.Controller)('api/trading'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    tslib_1.__metadata("design:paramtypes", [trading_service_1.TradingService])
], TradingController);
