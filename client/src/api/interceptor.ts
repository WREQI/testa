import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { getToken, clearToken, clearCachedUser } from './auth';
import { toast } from 'sonner';

let interceptorSet = false;
let notified401 = false;

export function setupAxiosAuthInterceptor() {
  if (interceptorSet) return;
  interceptorSet = true;

  axiosForBackend.interceptors.request.use(
    (config: any) => {
      const token = getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => Promise.reject(error),
  );

  axiosForBackend.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      if (error?.response?.status === 401) {
        const url = error?.config?.url || '';
        if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
          clearToken();
          clearCachedUser();
          if (!notified401) {
            notified401 = true;
            toast.error('登录已过期，请重新登录');
            setTimeout(() => {
              notified401 = false;
            }, 2000);
            window.dispatchEvent(new CustomEvent('auth:logout', {
              detail: { from: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/' },
            }));
          }
        }
      }
      return Promise.reject(error);
    },
  );
}

setupAxiosAuthInterceptor();
