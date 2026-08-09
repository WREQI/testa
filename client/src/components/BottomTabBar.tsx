import { NavLink } from 'react-router-dom';
import { TrendingUp, Star, ShoppingCart, User } from 'lucide-react';

const tabs = [
  { path: '/', label: '行情', icon: TrendingUp, end: true },
  { path: '/watchlist', label: '自选', icon: Star },
  { path: '/trade', label: '交易', icon: ShoppingCart },
  { path: '/profile', label: '我的', icon: User },
];

export const BottomTabBar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <Icon className="size-5" strokeWidth={1.8} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
