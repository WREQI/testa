import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Menu, X, TrendingUp, Star, LogOut, User, LogIn } from "lucide-react";
import { Button } from "@client/src/components/ui/button";
import { useAuth } from "@client/src/hooks/useAuth";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/watchlist", label: "自选股", icon: Star },
];

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  const activeTitle =
    navItems.find((item) => {
      if (item.path === "/") return location.pathname === "/";
      return location.pathname.startsWith(item.path);
    })?.label || "股票详情";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-sm bg-primary text-primary-foreground flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
            <span className="font-semibold text-base tracking-tight">
              StockLab
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-sm text-sm flex items-center gap-2 transition-colors ${
                    isActive
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`
                }
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!loading && (
              isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-sm"
                    onClick={() => setMenuOpen(!menuOpen)}
                  >
                    <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                      <User className="size-3.5" />
                    </div>
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {user?.nickname || user?.email}
                    </span>
                  </Button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-sm shadow-lg py-1 z-50">
                      <div className="px-3 py-2 border-b border-border">
                        <div className="text-sm font-medium truncate">
                          {user?.nickname}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent flex items-center gap-2"
                      >
                        <LogOut className="size-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => navigate("/login")}
                >
                  <LogIn className="size-4" />
                  <span>登录</span>
                </Button>
              )
            )}

            <button
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t border-border px-4 py-2 flex flex-col gap-0.5 bg-card">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-sm text-sm flex items-center gap-3 ${
                    isActive
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`
                }
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            {!loading && (
              isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-2.5 rounded-sm text-sm text-left text-destructive flex items-center gap-3 hover:bg-accent/60"
                >
                  <LogOut className="size-4" />
                  退出登录
                </button>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-sm text-sm text-primary flex items-center gap-3 hover:bg-accent/60"
                >
                  <LogIn className="size-4" />
                  登录
                </NavLink>
              )
            )}
          </nav>
        )}
      </header>

      <main className="flex-1 pt-4 pb-8 px-4 max-w-[1400px] mx-auto w-full">
        <div className="mb-4 text-xs text-muted-foreground">
          <span className="text-foreground font-medium">{activeTitle}</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
