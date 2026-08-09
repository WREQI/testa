import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  login as apiLogin,
  register as apiRegister,
  getProfile,
  logout as apiLogout,
  getToken,
  setToken,
  clearToken,
  getCachedUser,
  setCachedUser,
  clearCachedUser,
} from '@client/src/api/auth';
import type { AuthUser, RegisterRequest, LoginRequest } from '@shared/api.interface';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getCachedUser());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile);
          setCachedUser(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearToken();
          clearCachedUser();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const res = await apiLogin(data);
      setToken(res.token);
      setUser(res.user);
      setCachedUser(res.user);
      toast.success('登录成功');
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const res = await apiRegister(data);
      setToken(res.token);
      setUser(res.user);
      setCachedUser(res.user);
      toast.success('注册成功');
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    clearToken();
    clearCachedUser();
    toast.success('已退出登录');
    if (location.pathname.startsWith('/watchlist')) {
      navigate('/');
    }
  }, [navigate, location.pathname]);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const profile = await getProfile();
      setUser(profile);
      setCachedUser(profile);
    } catch {
      clearToken();
      clearCachedUser();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
