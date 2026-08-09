import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, HelpCircle, LogOut, ArrowUpRight, ArrowDownRight, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '@client/src/hooks/useAuth';
import { useWatchlist } from '@client/src/hooks/useWatchlist';
import { useTrading } from '@client/src/hooks/useTrading';
import { Button } from '@client/src/components/ui/button';

const ProfilePage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { items } = useWatchlist();
  const { account } = useTrading();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const settingsItems = [
    { icon: Star, label: '自选股管理', desc: `${items.length} 只` },
    { icon: HelpCircle, label: '帮助与反馈', desc: '' },
    { icon: Settings, label: '设置', desc: '' },
  ];

  return (
    <div className="pb-6">
      {/* User Header */}
      <div className="bg-card border-b border-border px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-full bg-accent flex items-center justify-center">
            <User className="size-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-foreground">
              {user?.nickname || user?.email || '未登录'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {user ? user.email : '登录后同步持仓与自选股'}
            </div>
          </div>
          {!user && (
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="text-xs h-8"
            >
              登录
            </Button>
          )}
        </div>

        {user && (
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">总资产</div>
              <div className="font-mono text-sm font-semibold text-foreground mt-1">
                {(account?.totalAssets ?? 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">今日盈亏</div>
              <div
                className={`font-mono text-sm font-semibold mt-1 ${
                  (account?.todayProfit ?? 0) >= 0 ? 'text-up' : 'text-down'
                }`}
              >
                {(account?.todayProfit ?? 0) >= 0 ? (
                  <ArrowUpRight className="size-3 inline align-middle" />
                ) : (
                  <ArrowDownRight className="size-3 inline align-middle" />
                )}
                {(account?.todayProfit ?? 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">自选股</div>
              <div className="font-mono text-sm font-semibold text-foreground mt-1">
                {items.length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings List */}
      <div className="mt-3 bg-card border-t border-b border-border">
        {settingsItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className="w-full flex items-center px-4 py-3 border-b border-border last:border-b-0 active:bg-accent/50"
            >
              <Icon className="size-5 text-muted-foreground mr-3" strokeWidth={1.5} />
              <span className="flex-1 text-left text-sm text-foreground">
                {item.label}
              </span>
              {item.desc && (
                <span className="text-xs text-muted-foreground mr-1">
                  {item.desc}
                </span>
              )}
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      {user && (
        <div className="mx-4 mt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="size-4 mr-2" />
            退出登录
          </Button>
        </div>
      )}

      <div className="mt-8 text-center text-[10px] text-muted-foreground">
        模拟交易仅供学习，不构成投资建议
      </div>
    </div>
  );
};

export default ProfilePage;
