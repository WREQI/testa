import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Search, Bell } from 'lucide-react';
import { toast } from 'sonner';

const MARKET_TABS: { key: string; label: string }[] = [
  { key: 'global', label: '全球' },
  { key: 'a', label: 'A股' },
  { key: 'hk', label: '港股' },
  { key: 'hkconnect', label: '港股通' },
  { key: 'us', label: '美股' },
  { key: 'fund', label: '基金' },
  { key: 'cb', label: '可转债' },
];

const SUB_TABS: { key: string; label: string }[] = [
  { key: 'hsj', label: '沪深京' },
  { key: 'sector', label: '板块' },
  { key: 'cyb', label: '创业板' },
  { key: 'kcb', label: '科创板' },
];

const MarketHeader = () => {
  const navigate = useNavigate();
  const [marketTab, setMarketTab] = useState<string>('a');
  const [subTab, setSubTab] = useState<string>('hsj');

  return (
    <div className="sticky top-0 z-20 bg-card border-b border-border">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 h-12">
        <Link to="/profile" className="size-8 flex items-center justify-center">
          <div className="size-7 rounded-full bg-accent flex items-center justify-center">
            <User className="size-4 text-foreground" />
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <button className="relative text-base font-bold text-foreground pb-1">
            行情
            <span className="absolute left-0 right-0 -bottom-[3px] h-[3px] bg-primary rounded-full" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/search')}
            className="size-8 flex items-center justify-center"
            aria-label="搜索"
          >
            <Search className="size-5 text-foreground" />
          </button>
          <button
            onClick={() => toast('暂无消息')}
            className="size-8 flex items-center justify-center relative"
            aria-label="消息"
          >
            <Bell className="size-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-semantic-up rounded-full" />
          </button>
        </div>
      </div>

      {/* 市场分类Tab栏 */}
      <div className="overflow-x-auto whitespace-nowrap px-2 [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex gap-5 px-2 h-9 items-center">
          {MARKET_TABS.map((tab) => {
            const active = marketTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMarketTab(tab.key)}
                className={`relative text-sm pb-1 ${
                  active
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute left-1/2 -translate-x-1/2 -bottom-[2px] w-5 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 子Tab栏 */}
      <div className="overflow-x-auto whitespace-nowrap px-4 pb-2 [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex gap-2">
          {SUB_TABS.map((tab) => {
            const active = subTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSubTab(tab.key)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  active
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketHeader;
