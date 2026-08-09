/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { bigint, date, foreignKey, index, integer, numeric, pgTable, smallint, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const tradingOrder = pgTable("trading_order", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  stockCode: varchar("stock_code", { length: 20 }).notNull(),
  stockName: varchar("stock_name", { length: 100 }).notNull(),
  direction: varchar("direction", { length: 10 }).notNull(),
  price: numeric("price").notNull(),
  quantity: integer("quantity").notNull(),
  amount: numeric("amount").notNull(),
  commission: numeric("commission").notNull().default('0'),
  stampTax: numeric("stamp_tax").notNull().default('0'),
  transferFee: numeric("transfer_fee").notNull().default('0'),
  status: varchar("status", { length: 20 }).notNull().default('filled'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_trading_order_user_id").on(table.userId),
  index("idx_trading_order_created").on(table.userId, table.createdAt),
]);

export const tradingPosition = pgTable("trading_position", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  stockCode: varchar("stock_code", { length: 20 }).notNull(),
  stockName: varchar("stock_name", { length: 100 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  avgCost: numeric("avg_cost").notNull().default('0'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("trading_position_user_id_stock_code_key").on(table.userId, table.stockCode),
  index("idx_trading_position_user_id").on(table.userId),
]);

export const tradingAccount = pgTable("trading_account", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  totalAssets: numeric("total_assets").notNull().default('1000000.00'),
  availableCash: numeric("available_cash").notNull().default('1000000.00'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("trading_account_user_id_key").on(table.userId),
]);

export const stockFavorites = pgTable("stock_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  stockCode: varchar("stock_code", { length: 20 }).notNull(),
  stockName: varchar("stock_name", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("stock_favorites_user_stock_key").on(table.userId, table.stockCode),
  index("idx_stock_favorites_user_id").on(table.userId),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUsers.id],
    name: "stock_favorites_user_id_fkey",
  }).onDelete("cascade"),
]);

export const appUsers = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  // Complex index: CREATE UNIQUE INDEX app_users_email_key ON app_users USING btree (lower((email)::text)),
]);

export const stockFinance = pgTable("stock_finance", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull(),
  reportYear: smallint("report_year").notNull(),
  reportQuarter: smallint("report_quarter").notNull(),
  reportType: varchar("report_type", { length: 20 }).notNull(),
  roe: numeric("roe"),
  grossMargin: numeric("gross_margin"),
  netMargin: numeric("net_margin"),
  totalAssetTurnover: numeric("total_asset_turnover"),
  inventoryTurnover: numeric("inventory_turnover"),
  revenueGrowth: numeric("revenue_growth"),
  netProfitGrowth: numeric("net_profit_growth"),
  dupontRoe: numeric("dupont_roe"),
  dupontAssetTurnover: numeric("dupont_asset_turnover"),
  dupontEquityMultiplier: numeric("dupont_equity_multiplier"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("stock_finance_code_report_year_report_quarter_report_type_key").on(table.code, table.reportYear, table.reportQuarter, table.reportType),
  index("idx_stock_finance_code_type").on(table.code, table.reportType, table.reportYear, table.reportQuarter),
]);

export const stockKline = pgTable("stock_kline", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull(),
  tradeDate: date("trade_date").notNull(),
  period: varchar("period", { length: 2 }).notNull().default('d'),
  adjustFlag: smallint("adjust_flag").notNull().default(2),
  open: numeric("open"),
  high: numeric("high"),
  low: numeric("low"),
  close: numeric("close"),
  volume: bigint("volume", { mode: 'number' }),
  amount: numeric("amount"),
  pctChg: numeric("pct_chg"),
  turn: numeric("turn"),
  peTtm: numeric("pe_ttm"),
  pbMrq: numeric("pb_mrq"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("stock_kline_code_period_adjust_flag_trade_date_key").on(table.code, table.period, table.adjustFlag, table.tradeDate),
  index("idx_stock_kline_code_period_adjust").on(table.code, table.period, table.adjustFlag, table.tradeDate),
]);

export const stockBasic = pgTable("stock_basic", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 10 }).notNull().default('stock'),
  market: varchar("market", { length: 10 }),
  industry: varchar("industry", { length: 100 }),
  listStatus: varchar("list_status", { length: 20 }).default('listing'),
  lastSyncDate: date("last_sync_date"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("stock_basic_code_key").on(table.code),
  index("idx_stock_basic_name").on(table.name),
  index("idx_stock_basic_industry").on(table.industry),
  index("idx_stock_basic_type").on(table.type),
]);

// table aliases
export const appUsersTable = appUsers;
export const stockBasicTable = stockBasic;
export const stockFavoritesTable = stockFavorites;
export const stockFinanceTable = stockFinance;
export const stockKlineTable = stockKline;
export const tradingAccountTable = tradingAccount;
export const tradingOrderTable = tradingOrder;
export const tradingPositionTable = tradingPosition;
