"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const trading_controller_1 = require("./trading.controller");
const trading_service_1 = require("./trading.service");
const auth_module_1 = require("../auth/auth.module");
let TradingModule = class TradingModule {
};
exports.TradingModule = TradingModule;
exports.TradingModule = TradingModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => auth_module_1.AuthModule)],
        controllers: [trading_controller_1.TradingController],
        providers: [trading_service_1.TradingService],
    })
], TradingModule);
