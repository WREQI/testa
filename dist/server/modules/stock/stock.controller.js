"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockController = void 0;
const tslib_1 = require("tslib");
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const stock_service_1 = require("./stock.service");
let StockController = class StockController {
    stockService;
    constructor(stockService) {
        this.stockService = stockService;
    }
    async search(q, limit) {
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.stockService.search(q, limitNum);
    }
    async hot() {
        return this.stockService.getHotStocks();
    }
    async industries() {
        return this.stockService.getIndustries();
    }
    async list(industry, sortBy, order, page = '1', pageSize = '50') {
        return this.stockService.getStockList({
            industry,
            sortBy,
            order,
            page: parseInt(page, 10),
            pageSize: parseInt(pageSize, 10),
        });
    }
    async kline(code, period = 'd', adjust = '2', startDate, endDate) {
        return this.stockService.getKline(code, period, parseInt(adjust, 10), startDate, endDate);
    }
    async quote(code) {
        const data = await this.stockService.getQuote(code);
        if (!data)
            throw new common_1.NotFoundException('行情数据不存在');
        return data;
    }
    async finance(code, type = 'profit', year) {
        return this.stockService.getFinance(code, type, year ? parseInt(year, 10) : undefined);
    }
    async gridSimulate(code, body) {
        return this.stockService.simulateGrid(code, body);
    }
};
exports.StockController = StockController;
tslib_1.__decorate([
    (0, common_1.Get)('search'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Query)('q')),
    tslib_1.__param(1, (0, common_1.Query)('limit')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String]),
    tslib_1.__metadata("design:returntype", Promise)
], StockController.prototype, "search", null);
tslib_1.__decorate([
    (0, common_1.Get)('hot'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], StockController.prototype, "hot", null);
tslib_1.__decorate([
    (0, common_1.Get)('industries'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], StockController.prototype, "industries", null);
tslib_1.__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Query)('industry')),
    tslib_1.__param(1, (0, common_1.Query)('sortBy')),
    tslib_1.__param(2, (0, common_1.Query)('order')),
    tslib_1.__param(3, (0, common_1.Query)('page')),
    tslib_1.__param(4, (0, common_1.Query)('pageSize')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, String, Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], StockController.prototype, "list", null);
tslib_1.__decorate([
    (0, common_1.Get)(':code/kline'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Param)('code')),
    tslib_1.__param(1, (0, common_1.Query)('period')),
    tslib_1.__param(2, (0, common_1.Query)('adjust')),
    tslib_1.__param(3, (0, common_1.Query)('startDate')),
    tslib_1.__param(4, (0, common_1.Query)('endDate')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, String, String, String]),
    tslib_1.__metadata("design:returntype", Promise)
], StockController.prototype, "kline", null);
tslib_1.__decorate([
    (0, common_1.Get)(':code/quote'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Param)('code')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], StockController.prototype, "quote", null);
tslib_1.__decorate([
    (0, common_1.Get)(':code/finance'),
    openapi.ApiResponse({ status: 200, type: Object }),
    tslib_1.__param(0, (0, common_1.Param)('code')),
    tslib_1.__param(1, (0, common_1.Query)('type')),
    tslib_1.__param(2, (0, common_1.Query)('year')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, String]),
    tslib_1.__metadata("design:returntype", Promise)
], StockController.prototype, "finance", null);
tslib_1.__decorate([
    (0, common_1.Post)(':code/grid-simulate'),
    openapi.ApiResponse({ status: 201, type: Object }),
    tslib_1.__param(0, (0, common_1.Param)('code')),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], StockController.prototype, "gridSimulate", null);
exports.StockController = StockController = tslib_1.__decorate([
    (0, common_1.Controller)('api/stocks'),
    tslib_1.__metadata("design:paramtypes", [stock_service_1.StockService])
], StockController);
