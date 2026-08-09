import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  AuthUser,
} from '@shared/api.interface';

const TOKEN_KEY = 'stocklab_token';
const USER_KEY = 'stocklab_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getCachedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setCachedUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCachedUser(): void {
  localStorage.removeItem(USER_KEY);
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  try {
    const res = await axiosForBackend.post('/api/auth/register', data);
    return res.data as AuthResponse;
  } catch (error) {
    logger.error('register error', error);
    throw error;
  }
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const res = await axiosForBackend.post('/api/auth/login', data);
    return res.data as AuthResponse;
  } catch (error) {
    logger.error('login error', error);
    throw error;
  }
}

export async function getProfile(): Promise<AuthUser> {
  try {
    const res = await axiosForBackend.get('/api/auth/profile');
    return res.data as AuthUser;
  } catch (error) {
    logger.error('getProfile error', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await axiosForBackend.post('/api/auth/logout');
  } catch (error) {
    logger.error('logout error', error);
  } finally {
    clearToken();
    clearCachedUser();
  }
}
