import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { useAuth } from '@client/src/hooks/useAuth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const validateEmail = (val: string): boolean => {
    if (!val) {
      setEmailError('请输入邮箱');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError('邮箱格式不正确');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('请输入密码');
      return false;
    }
    if (val.length < 6) {
      setPasswordError('密码长度至少6位');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateConfirm = (val: string): boolean => {
    if (!val) {
      setConfirmError('请确认密码');
      return false;
    }
    if (val !== password) {
      setConfirmError('两次输入的密码不一致');
      return false;
    }
    setConfirmError(null);
    return true;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const emailOk = validateEmail(email);
      const pwdOk = validatePassword(password);
      const confirmOk = validateConfirm(confirmPassword);

      if (!emailOk || !pwdOk || !confirmOk) return;

      setLoading(true);
      try {
        await register({ email: email.trim(), password });
        navigate('/', { replace: true });
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || '注册失败';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [email, password, confirmPassword, register, navigate],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">注册账号</h1>
          <p className="text-sm text-muted-foreground">
            创建账号，同步您的自选股和设置
          </p>
        </div>

        <div className="bg-card border border-border rounded-sm p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">
                邮箱
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => email && validateEmail(email)}
                placeholder="your@email.com"
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">
                密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                    if (confirmError && confirmPassword) {
                      setConfirmError(
                        e.target.value === confirmPassword ? null : '两次输入的密码不一致',
                      );
                    }
                  }}
                  onBlur={() => password && validatePassword(password)}
                  placeholder="至少6位"
                  className={`pr-10 ${passwordError ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs">
                确认密码
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) validateConfirm(e.target.value);
                  }}
                  onBlur={() => confirmPassword && validateConfirm(confirmPassword)}
                  placeholder="再次输入密码"
                  className={`pr-10 ${confirmError ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {confirmError && (
                <p className="text-xs text-destructive">{confirmError}</p>
              )}
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-sm flex items-center gap-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="size-4 mr-2" />
              )}
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
            已有账号？{' '}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
