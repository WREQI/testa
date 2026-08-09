"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradingPositionTable = exports.tradingOrderTable = exports.tradingAccountTable = exports.stockKlineTable = exports.stockFinanceTable = exports.stockFavoritesTable = exports.stockBasicTable = exports.appUsersTable = exports.stockBasic = exports.stockKline = exports.stockFinance = exports.appUsers = exports.stockFavorites = exports.tradingAccount = exports.tradingPosition = exports.tradingOrder = exports.fileAttachmentArray = exports.userProfileArray = exports.fileAttachment = exports.userProfile = exports.customTimestamptz = void 0;
exports.escapeLiteral = escapeLiteral;
/* eslint-disable */
/** auto generated, do not edit */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.customTimestamptz = (0, pg_core_1.customType)({
    dataType(config) {
        const precision = typeof config?.precision !== 'undefined'
            ? ` (${config.precision})`
            : '';
        return `timestamptz${precision}`;
    },
    toDriver(value) {
        if (value == null)
            return value;
        if (typeof value === 'number')
            return new Date(value).toISOString();
        if (typeof value === 'string')
            return value;
        if (value instanceof Date)
            return value.toISOString();
        throw new Error('Invalid timestamp value');
    },
    fromDriver(value) {
        if (value instanceof Date)
            return value;
        return new Date(value);
    },
});
exports.userProfile = (0, pg_core_1.customType)({
    dataType() {
        return 'user_profile';
    },
    toDriver(value) {
        return (0, drizzle_orm_1.sql) `ROW(${value})::user_profile`;
    },
    fromDriver(value) {
        const [userId] = value.slice(1, -1).split(',');
        return userId.trim();
    },
});
exports.fileAttachment = (0, pg_core_1.customType)({
    dataType() {
        return 'file_attachment';
    },
    toDriver(value) {
        return (0, drizzle_orm_1.sql) `ROW(${value.bucket_id},${value.file_path})::file_attachment`;
    },
    fromDriver(value) {
        const [bucketId, filePath] = value.slice(1, -1).split(',');
        return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    },
});
function escapeLiteral(str) {
    return "'" + str.replace(/'/g, "''") + "'";
}
exports.userProfileArray = (0, pg_core_1.customType)({
    dataType() {
        return 'user_profile[]';
    },
    toDriver(value) {
        if (!value || value.length === 0) {
            return (0, drizzle_orm_1.sql) `'{}'::user_profile[]`;
        }
        const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
        return drizzle_orm_1.sql.raw(`ARRAY[${elements}]::user_profile[]`);
    },
    fromDriver(value) {
        if (!value || value === '{}')
            return [];
        const inner = value.slice(1, -1);
        const matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map(m => m.slice(1, -1).split(',')[0].trim());
    },
});
exports.fileAttachmentArray = (0, pg_core_1.customType)({
    dataType() {
        return 'file_attachment[]';
    },
    toDriver(value) {
        if (!value || value.length === 0) {
            return (0, drizzle_orm_1.sql) `'{}'::file_attachment[]`;
        }
        const elements = value.map(f => `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`).join(',');
        return drizzle_orm_1.sql.raw(`ARRAY[${elements}]::file_attachment[]`);
    },
    fromDriver(value) {
        if (!value || value === '{}')
            return [];
        const inner = value.slice(1, -1);
        const matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map(m => {
            const [bucketId, filePath] = m.slice(1, -1).split(',');
            return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
        });
    },
});
exports.tradingOrder = (0, pg_core_1.pgTable)("trading_order", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    stockCode: (0, pg_core_1.varchar)("stock_code", { length: 20 }).notNull(),
    stockName: (0, pg_core_1.varchar)("stock_name", { length: 100 }).notNull(),
    direction: (0, pg_core_1.varchar)("direction", { length: 10 }).notNull(),
    price: (0, pg_core_1.numeric)("price").notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    amount: (0, pg_core_1.numeric)("amount").notNull(),
    commission: (0, pg_core_1.numeric)("commission").notNull().default('0'),
    stampTax: (0, pg_core_1.numeric)("stamp_tax").notNull().default('0'),
    transferFee: (0, pg_core_1.numeric)("transfer_fee").notNull().default('0'),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).notNull().default('filled'),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.index)("idx_trading_order_user_id").on(table.userId),
    (0, pg_core_1.index)("idx_trading_order_created").on(table.userId, table.createdAt),
]);
exports.tradingPosition = (0, pg_core_1.pgTable)("trading_position", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    stockCode: (0, pg_core_1.varchar)("stock_code", { length: 20 }).notNull(),
    stockName: (0, pg_core_1.varchar)("stock_name", { length: 100 }).notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull().default(0),
    avgCost: (0, pg_core_1.numeric)("avg_cost").notNull().default('0'),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("trading_position_user_id_stock_code_key").on(table.userId, table.stockCode),
    (0, pg_core_1.index)("idx_trading_position_user_id").on(table.userId),
]);
exports.tradingAccount = (0, pg_core_1.pgTable)("trading_account", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull().unique(),
    totalAssets: (0, pg_core_1.numeric)("total_assets").notNull().default('1000000.00'),
    availableCash: (0, pg_core_1.numeric)("available_cash").notNull().default('1000000.00'),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("trading_account_user_id_key").on(table.userId),
]);
exports.stockFavorites = (0, pg_core_1.pgTable)("stock_favorites", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    stockCode: (0, pg_core_1.varchar)("stock_code", { length: 20 }).notNull(),
    stockName: (0, pg_core_1.varchar)("stock_name", { length: 100 }).notNull(),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("stock_favorites_user_stock_key").on(table.userId, table.stockCode),
    (0, pg_core_1.index)("idx_stock_favorites_user_id").on(table.userId),
    (0, pg_core_1.foreignKey)({
        columns: [table.userId],
        foreignColumns: [exports.appUsers.id],
        name: "stock_favorites_user_id_fkey",
    }).onDelete("cascade"),
]);
exports.appUsers = (0, pg_core_1.pgTable)("app_users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull(),
    passwordHash: (0, pg_core_1.varchar)("password_hash", { length: 255 }).notNull(),
    nickname: (0, pg_core_1.varchar)("nickname", { length: 100 }),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
// Complex index: CREATE UNIQUE INDEX app_users_email_key ON app_users USING btree (lower((email)::text)),
]);
exports.stockFinance = (0, pg_core_1.pgTable)("stock_finance", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    code: (0, pg_core_1.varchar)("code", { length: 20 }).notNull(),
    reportYear: (0, pg_core_1.smallint)("report_year").notNull(),
    reportQuarter: (0, pg_core_1.smallint)("report_quarter").notNull(),
    reportType: (0, pg_core_1.varchar)("report_type", { length: 20 }).notNull(),
    roe: (0, pg_core_1.numeric)("roe"),
    grossMargin: (0, pg_core_1.numeric)("gross_margin"),
    netMargin: (0, pg_core_1.numeric)("net_margin"),
    totalAssetTurnover: (0, pg_core_1.numeric)("total_asset_turnover"),
    inventoryTurnover: (0, pg_core_1.numeric)("inventory_turnover"),
    revenueGrowth: (0, pg_core_1.numeric)("revenue_growth"),
    netProfitGrowth: (0, pg_core_1.numeric)("net_profit_growth"),
    dupontRoe: (0, pg_core_1.numeric)("dupont_roe"),
    dupontAssetTurnover: (0, pg_core_1.numeric)("dupont_asset_turnover"),
    dupontEquityMultiplier: (0, pg_core_1.numeric)("dupont_equity_multiplier"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("stock_finance_code_report_year_report_quarter_report_type_key").on(table.code, table.reportYear, table.reportQuarter, table.reportType),
    (0, pg_core_1.index)("idx_stock_finance_code_type").on(table.code, table.reportType, table.reportYear, table.reportQuarter),
]);
exports.stockKline = (0, pg_core_1.pgTable)("stock_kline", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    code: (0, pg_core_1.varchar)("code", { length: 20 }).notNull(),
    tradeDate: (0, pg_core_1.date)("trade_date").notNull(),
    period: (0, pg_core_1.varchar)("period", { length: 2 }).notNull().default('d'),
    adjustFlag: (0, pg_core_1.smallint)("adjust_flag").notNull().default(2),
    open: (0, pg_core_1.numeric)("open"),
    high: (0, pg_core_1.numeric)("high"),
    low: (0, pg_core_1.numeric)("low"),
    close: (0, pg_core_1.numeric)("close"),
    volume: (0, pg_core_1.bigint)("volume", { mode: 'number' }),
    amount: (0, pg_core_1.numeric)("amount"),
    pctChg: (0, pg_core_1.numeric)("pct_chg"),
    turn: (0, pg_core_1.numeric)("turn"),
    peTtm: (0, pg_core_1.numeric)("pe_ttm"),
    pbMrq: (0, pg_core_1.numeric)("pb_mrq"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("stock_kline_code_period_adjust_flag_trade_date_key").on(table.code, table.period, table.adjustFlag, table.tradeDate),
    (0, pg_core_1.index)("idx_stock_kline_code_period_adjust").on(table.code, table.period, table.adjustFlag, table.tradeDate),
]);
exports.stockBasic = (0, pg_core_1.pgTable)("stock_basic", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    code: (0, pg_core_1.varchar)("code", { length: 20 }).notNull().unique(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 10 }).notNull().default('stock'),
    market: (0, pg_core_1.varchar)("market", { length: 10 }),
    industry: (0, pg_core_1.varchar)("industry", { length: 100 }),
    listStatus: (0, pg_core_1.varchar)("list_status", { length: 20 }).default('listing'),
    lastSyncDate: (0, pg_core_1.date)("last_sync_date"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: (0, exports.userProfile)("_created_by").default((0, drizzle_orm_1.sql) `CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: (0, exports.userProfile)("_updated_by").default((0, drizzle_orm_1.sql) `CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("stock_basic_code_key").on(table.code),
    (0, pg_core_1.index)("idx_stock_basic_name").on(table.name),
    (0, pg_core_1.index)("idx_stock_basic_industry").on(table.industry),
    (0, pg_core_1.index)("idx_stock_basic_type").on(table.type),
]);
// table aliases
exports.appUsersTable = exports.appUsers;
exports.stockBasicTable = exports.stockBasic;
exports.stockFavoritesTable = exports.stockFavorites;
exports.stockFinanceTable = exports.stockFinance;
exports.stockKlineTable = exports.stockKline;
exports.tradingAccountTable = exports.tradingAccount;
exports.tradingOrderTable = exports.tradingOrder;
exports.tradingPositionTable = exports.tradingPosition;
