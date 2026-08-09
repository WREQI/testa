"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const stock_controller_1 = require("./stock.controller");
const market_controller_1 = require("./market.controller");
const favorites_controller_1 = require("./favorites.controller");
const stock_service_1 = require("./stock.service");
const stock_cache_service_1 = require("./stock-cache.service");
const stock_sdk_data_service_1 = require("./stock-sdk-data.service");
const grid_simulation_service_1 = require("./grid-simulation.service");
const favorites_service_1 = require("./favorites.service");
const auth_module_1 = require("../auth/auth.module");
let StockModule = class StockModule {
};
exports.StockModule = StockModule;
exports.StockModule = StockModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => auth_module_1.AuthModule)],
        controllers: [stock_controller_1.StockController, market_controller_1.MarketController, favorites_controller_1.FavoritesController],
        providers: [stock_service_1.StockService, stock_cache_service_1.StockCacheService, stock_sdk_data_service_1.StockSdkDataService, grid_simulation_service_1.GridSimulationService, favorites_service_1.FavoritesService],
    })
], StockModule);
