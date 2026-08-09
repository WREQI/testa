"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketController = void 0;
const tslib_1 = require("tslib");
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const stock_service_1 = require("../stock/stock.service");
let MarketController = class MarketController {
    stockService;
    constructor(stockService) {
        this.stockService = stockService;
    }
    async indices() {
        return this.stockService.getIndices();
    }
};
exports.MarketController = MarketController;
tslib_1.__decorate([
    (0, common_1.Get)('indices'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], MarketController.prototype, "indices", null);
exports.MarketController = MarketController = tslib_1.__decorate([
    (0, common_1.Controller)('api/market'),
    tslib_1.__metadata("design:paramtypes", [stock_service_1.StockService])
], MarketController);
