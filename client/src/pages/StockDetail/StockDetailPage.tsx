import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  ChevronLeft,
  Search,
  RefreshCw,
  MessageSquare,
  Bell,
  Share2,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { getKline, getQuote, getFinance } from '@client/src/api/stock';
import QuoteHeader from './QuoteHeader';
import KlineSection, {
  type Period,
  type Adjust,
  type RangeKey,
} from './KlineSection';
import type { IndicatorType } from '@client/src/components/KLineChart/KLineChart';
import GridSimulator from '@client/src/components/GridSimulator/GridSimulator';
import TradePanel from '@client/src/components/TradePanel/TradePanel';
import { useAuth } from '@client/src/hooks/useAuth';
import type { FinanceType } from '@shared/api.interface';
import {
  MoneyTab,
  NewsTab,
  ProfileTab,
  AnalysisTab,
  FinanceTab,
} from './TabContents';

type DetailTab = 'quote' | 'news' | 'money' | 'profile' | 'analysis' | 'finance' | 'grid';

const TAB_LIST: { key: DetailTab; label: string }[] = [
  { key: 'quote', label: '行情' },
  { key: 'news', label: '资讯' },
  { key: 'money', label: '资金' },
  { key: 'profile', label: '简况' },
  { key: 'analysis', label: '分析' },
  { key: 'finance', label: '财务' },
  { key: 'grid', label: '网格' },
];

const RANGE_DAYS: Record<RangeKey, number | 'all'> = {
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  '3y': 1095,
  all: 'all',
};

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calcStartDate(range: RangeKey, endDate: string): string {
  const days = RANGE_DAYS[range];
  if (days === 'all') return '2015-01-01';
  const end = new Date(endDate);
  end.setDate(end.getDate() - days);
  return formatDate(end);
}

const StockDetailPage = () => {
  const { code } = useParams<{ code: string }>();
  const stockCode = code || '';
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState<Period>('d');
  const [adjust, setAdjust] = useState<Adjust>(2);
  const [range, setRange] = useState<RangeKey>('3m');
  const [indicator, setIndicator] = useState<IndicatorType>('none');
  const [financeType, setFinanceType] = useState<FinanceType>('profit');
  const [detailTab, setDetailTab] = useState<DetailTab>('quote');
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeDirection, setTradeDirection] = useState<'buy' | 'sell'>('buy');
  const { isAuthenticated } = useAuth();

  const endDate = useMemo(() => formatDate(new Date()), []);
  const startDate = useMemo(
    () => calcStartDate(range, endDate),
    [range, endDate],
  );

  const {
    data: quoteData,
    isLoading: quoteLoading,
    isError: quoteError,
  } = useQuery({
    queryKey: ['quote', stockCode],
    queryFn: () => getQuote(stockCode),
    enabled: !!stockCode,
  });

  const financeQuery = useQuery({
    queryKey: ['finance', stockCode, financeType],
    queryFn: () => getFinance(stockCode, financeType),
    enabled: !!stockCode && detailTab === 'finance',
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: klineData,
    isLoading: klineLoading,
    isError: klineError,
  } = useQuery({
    queryKey: ['kline', stockCode, period, adjust, startDate, endDate],
    queryFn: () =>
      getKline({
        code: stockCode,
        period,
        adjust,
        startDate,
        endDate,
      }),
    enabled: !!stockCode && ['quote', 'grid'].includes(detailTab),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['quote', stockCode] });
    queryClient.invalidateQueries({ queryKey: ['kline', stockCode] });
    toast.success('已刷新行情数据');
  };

  const handleSearch = () => {
    toast.info('搜索功能开发中');
  };

  const handleShare = () => {
    toast.info('分享功能开发中');
  };

  const handleComment = () => {
    toast.info('评论功能开发中');
  };

  const handleNotify = () => {
    toast.info('提醒功能开发中');
  };

  const handleMore = () => {
    toast.info('更多功能开发中');
  };

  const handleOpenTrade = (direction: 'buy' | 'sell') => {
    if (!isAuthenticated) {
      toast('请先登录后进行交易', {
        action: {
          label: '去登录',
          onClick: () => navigate('/login', { state: { from: location.pathname } }),
        },
      });
      return;
    }
    setTradeDirection(direction);
    setTradeOpen(true);
  };

  const handleTradeSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['quote', stockCode] });
    queryClient.invalidateQueries({ queryKey: ['kline', stockCode] });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleTabClick = (tab: DetailTab) => {
    setDetailTab(tab);
  };

  const klineItems = klineData?.items || [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-[120px]">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-30 bg-card border-b border-border h-14 flex items-center px-3">
        <button
          onClick={handleGoBack}
          className="p-2 -ml-2 text-foreground hover:text-primary transition-colors"
          aria-label="返回"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="flex-1 text-center min-w-0">
          {quoteLoading ? (
            <div className="space-y-0.5">
              <Skeleton className="h-5 w-24 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ) : quoteData ? (
            <div className="leading-tight">
              <div className="text-base font-semibold truncate">
                {quoteData.name}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono font-tabular">
                {quoteData.code}
                {quoteData.code.startsWith('6') ? '.SH' : '.SZ'}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1 -mr-2">
          <button
            onClick={handleSearch}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="搜索"
          >
            <Search className="size-5" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="刷新"
          >
            <RefreshCw className="size-5" />
          </button>
        </div>
      </header>

      {/* 价格头卡 + 行情数据网格 (只在行情 Tab 显示) */}
      {detailTab === 'quote' && (
        <div className="px-3 pt-3">
          <QuoteHeader
            quote={quoteData}
            loading={quoteLoading}
            error={quoteError}
          />
        </div>
      )}

      {/* 功能 Tab 栏 */}
      <div className="sticky top-14 z-20 bg-card border-b border-border">
        <div className="flex overflow-x-auto -mx-3 px-3 scrollbar-hide">
          {TAB_LIST.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`
                flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${detailTab === tab.key
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 各 Tab 内容 */}
      <main className="px-3 pt-3">
        {detailTab === 'quote' && (
          <KlineSection
            items={klineItems}
            loading={klineLoading}
            error={klineError}
            period={period}
            adjust={adjust}
            range={range}
            indicator={indicator}
            onPeriodChange={setPeriod}
            onAdjustChange={setAdjust}
            onRangeChange={setRange}
            onIndicatorChange={setIndicator}
          />
        )}

        {detailTab === 'news' && <NewsTab />}
        {detailTab === 'money' && <MoneyTab />}
        {detailTab === 'profile' && <ProfileTab quote={quoteData} />}
        {detailTab === 'analysis' && <AnalysisTab />}
        {detailTab === 'finance' && (
          <FinanceTab
            data={financeQuery.data?.items}
            type={financeType}
            onTypeChange={setFinanceType}
            loading={financeQuery.isFetching}
            error={financeQuery.isError ? '财务数据加载失败' : null}
          />
        )}
        {detailTab === 'grid' && (
          <GridSimulator code={stockCode} klineItems={klineItems} />
        )}
      </main>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-3 py-2.5 flex items-center gap-2">
        <div className="flex items-center">
          <button
            onClick={handleComment}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="评论"
          >
            <MessageSquare className="size-5" />
          </button>
          <button
            onClick={handleNotify}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="提醒"
          >
            <Bell className="size-5" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="分享"
          >
            <Share2 className="size-5" />
          </button>
          <button
            onClick={handleMore}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="更多"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>

        <div className="flex-1 flex items-center gap-2 ml-2">
          <button
            onClick={() => handleOpenTrade('sell')}
            className="flex-1 h-11 rounded-sm bg-down text-white font-medium text-sm transition-colors hover:opacity-90"
          >
            卖出
          </button>
          <button
            onClick={() => handleOpenTrade('buy')}
            className="flex-1 h-11 rounded-sm bg-up text-white font-medium text-sm transition-colors hover:opacity-90"
          >
            买入
          </button>
        </div>
      </div>

      <TradePanel
        open={tradeOpen}
        direction={tradeDirection}
        stockCode={stockCode}
        stockName={quoteData?.name}
        price={quoteData ? String(quoteData.close) : ''}
        quantity="100"
        showStockSearch={false}
        onClose={() => setTradeOpen(false)}
        onDirectionChange={setTradeDirection}
        onSuccess={handleTradeSuccess}
      />
    </div>
  );
};

export default StockDetailPage;
