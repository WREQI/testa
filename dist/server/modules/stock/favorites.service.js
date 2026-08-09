"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoritesService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const fullstack_nestjs_core_1 = require("@lark-apaas/fullstack-nestjs-core");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../database/schema");
let FavoritesService = class FavoritesService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list(userId) {
        const rows = await this.db
            .select({
            id: schema_1.stockFavorites.id,
            stockCode: schema_1.stockFavorites.stockCode,
            stockName: schema_1.stockFavorites.stockName,
            createdAt: schema_1.stockFavorites.createdAt,
        })
            .from(schema_1.stockFavorites)
            .where((0, drizzle_orm_1.eq)(schema_1.stockFavorites.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`))
            .orderBy(schema_1.stockFavorites.createdAt);
        return rows.map((row) => ({
            id: row.id,
            stockCode: row.stockCode,
            stockName: row.stockName,
            createdAt: row.createdAt.toISOString(),
        }));
    }
    async add(userId, stockCode, stockName) {
        const existing = await this.db
            .select({ id: schema_1.stockFavorites.id })
            .from(schema_1.stockFavorites)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockFavorites.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`), (0, drizzle_orm_1.eq)(schema_1.stockFavorites.stockCode, stockCode)))
            .limit(1);
        if (existing.length > 0) {
            throw new common_1.ConflictException('该股票已在自选列表中');
        }
        const [result] = await this.db
            .insert(schema_1.stockFavorites)
            .values({
            userId: (0, drizzle_orm_1.sql) `${userId}::uuid`,
            stockCode,
            stockName,
        })
            .returning({
            id: schema_1.stockFavorites.id,
            stockCode: schema_1.stockFavorites.stockCode,
            stockName: schema_1.stockFavorites.stockName,
            createdAt: schema_1.stockFavorites.createdAt,
        });
        return {
            id: result.id,
            stockCode: result.stockCode,
            stockName: result.stockName,
            createdAt: result.createdAt.toISOString(),
        };
    }
    async remove(userId, stockCode) {
        const deleted = await this.db
            .delete(schema_1.stockFavorites)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockFavorites.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`), (0, drizzle_orm_1.eq)(schema_1.stockFavorites.stockCode, stockCode)))
            .returning({ id: schema_1.stockFavorites.id });
        if (deleted.length === 0) {
            return;
        }
    }
    async check(userId, stockCode) {
        const rows = await this.db
            .select({ id: schema_1.stockFavorites.id })
            .from(schema_1.stockFavorites)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockFavorites.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`), (0, drizzle_orm_1.eq)(schema_1.stockFavorites.stockCode, stockCode)))
            .limit(1);
        return rows.length > 0;
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_2.Inject)(fullstack_nestjs_core_1.DRIZZLE_DATABASE)),
    tslib_1.__metadata("design:paramtypes", [Function])
], FavoritesService);
