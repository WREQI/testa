export interface StockBasic {
    code: string;
    name: string;
    type: 'stock' | 'index';
    market?: string;
    industry?: string;
}
export interface KlineItem {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    amount: number;
    pctChg: number;
    turn?: number;
    peTTM?: number;
    pbMRQ?: number;
}
export interface StockQuote {
    code: string;
    name: string;
    close: number;
    change: number;
    pctChg: number;
    open: number;
    high: number;
    low: number;
    preClose: number;
    volume: number;
    amount: number;
    turn?: number;
    peTTM?: number;
    pbMRQ?: number;
    updateTime?: string;
}
export type FinanceType = 'profit' | 'operation' | 'growth' | 'dupont';
export interface FinanceItem {
    year: number;
    quarter: number;
    roe?: number;
    grossMargin?: number;
    netMargin?: number;
    totalAssetTurnover?: number;
    inventoryTurnover?: number;
    revenueGrowth?: number;
    netProfitGrowth?: number;
    dupontRoe?: number;
    dupontAssetTurnover?: number;
    dupontEquityMultiplier?: number;
}
export interface HotStock {
    code: string;
    name: string;
    type: 'stock' | 'index';
    close: number;
    pctChg: number;
    change: number;
}
export interface IndexQuote {
    code: string;
    name: string;
    close: number;
    change: number;
    pctChg: number;
}
export interface StockListParams {
    industry?: string;
    sortBy?: 'pctChg' | 'volume' | 'amount' | 'peTTM' | 'pbMRQ' | 'turn';
    order?: 'asc' | 'desc';
    page: number;
    pageSize: number;
}
export interface StockListItem {
    code: string;
    name: string;
    industry?: string;
    close: number;
    pctChg: number;
    change: number;
    volume: number;
    amount: number;
    peTTM?: number;
    pbMRQ?: number;
    turn?: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
export interface GridSimulateRequest {
    startDate: string;
    endDate: string;
    basePrice: number;
    upperPercent: number;
    lowerPercent: number;
    gridSpacingPercent: number;
    sharesPerGrid: number;
    initialShares: number;
    initialPrice?: number;
    commissionRate: number;
    minCommission: number;
    stampDutyRate: number;
    transferFeeRate: number;
}
export interface GridTrade {
    date: string;
    type: 'buy' | 'sell';
    price: number;
    shares: number;
    amount: number;
    fee: number;
    holding: number;
}
export interface GridEquityPoint {
    date: string;
    value: number;
    holdValue: number;
}
export interface GridSimulateResult {
    totalReturn: number;
    totalProfit: number;
    totalTrades: number;
    buyTrades: number;
    sellTrades: number;
    totalFee: number;
    maxDrawdown: number;
    holdReturn: number;
    excessReturn: number;
    trades: GridTrade[];
    equityCurve: GridEquityPoint[];
    gridLines: number[];
}
export interface AuthUser {
    id: string;
    email: string;
    nickname: string;
    createdAt: string;
}
export interface AuthResponse {
    user: AuthUser;
    token: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface FavoriteItem {
    id: string;
    stockCode: string;
    stockName: string;
    createdAt: string;
}
export interface AddFavoriteRequest {
    stockCode: string;
    stockName: string;
}
export interface TradingAccount {
    totalAssets: number;
    availableCash: number;
    marketValue: number;
    todayProfit: number;
    todayPct: number;
    positionProfit: number;
    positionPct: number;
}
export interface PositionItem {
    stockCode: string;
    stockName: string;
    quantity: number;
    avgCost: number;
    currentPrice: number;
    marketValue: number;
    profit: number;
    profitPct: number;
    todayProfit: number;
    todayPct: number;
}
export interface OrderItem {
    id: string;
    stockCode: string;
    stockName: string;
    direction: 'buy' | 'sell';
    price: number;
    quantity: number;
    amount: number;
    commission: number;
    stampTax: number;
    transferFee: number;
    status: string;
    createdAt: string;
}
export interface TradeRequest {
    stockCode: string;
    stockName: string;
    price: number;
    quantity: number;
    direction: 'buy' | 'sell';
}
export interface TradeResult {
    success: boolean;
    orderId?: string;
    message?: string;
}
