import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, sql } from 'drizzle-orm';
import * as crypto from 'crypto';
import { appUsers } from '@server/database/schema';
import type { AuthUser, AuthResponse, RegisterRequest, LoginRequest } from '@shared/api.interface';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET must be configured in production'); })()
  : crypto.randomBytes(32).toString('hex'));
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
const SALT_LEN = 16;
const HASH_ITERATIONS = 10000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LEN).toString('hex');
  const derived = crypto.pbkdf2Sync(
    password,
    salt,
    HASH_ITERATIONS,
    HASH_KEYLEN,
    HASH_DIGEST,
  ).toString('hex');
  return `pbkdf2_sha512$${HASH_ITERATIONS}$${salt}$${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split('$');
    if (parts.length !== 4) return false;
    const [, iterStr, salt, derived] = parts;
    const iterations = parseInt(iterStr, 10);
    const computed = crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      HASH_KEYLEN,
      HASH_DIGEST,
    ).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(derived));
  } catch {
    return false;
  }
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async register(dto: RegisterRequest): Promise<AuthResponse> {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;

    if (!email || !validateEmail(email)) {
      throw new BadRequestException('邮箱格式不正确');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('密码长度至少6位');
    }

    const existing = await this.db
      .select({ id: appUsers.id })
      .from(appUsers)
      .where(eq(appUsers.email, sql`lower(${email})`))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException('该邮箱已被注册');
    }

    const passwordHash = hashPassword(password);
    const nickname = email.split('@')[0];

    let user;
    try {
      [user] = await this.db
        .insert(appUsers)
        .values({ email, passwordHash, nickname })
        .returning({
          id: appUsers.id,
          email: appUsers.email,
          nickname: appUsers.nickname,
          createdAt: appUsers.createdAt,
        });
    } catch (error) {
      if (typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505') {
        throw new BadRequestException('该邮箱已被注册');
      }
      throw error;
    }

    const token = this.signToken(user.id);
    return {
      user: this.toUserDto(user),
      token,
    };
  }

  async login(dto: LoginRequest): Promise<AuthResponse> {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;

    if (!email || !password) {
      throw new BadRequestException('邮箱和密码不能为空');
    }

    const rows = await this.db
      .select({
        id: appUsers.id,
        email: appUsers.email,
        nickname: appUsers.nickname,
        passwordHash: appUsers.passwordHash,
        createdAt: appUsers.createdAt,
      })
      .from(appUsers)
      .where(eq(appUsers.email, sql`lower(${email})`))
      .limit(1);

    if (rows.length === 0) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const user = rows[0];
    if (!verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const token = this.signToken(user.id);
    return {
      user: this.toUserDto(user),
      token,
    };
  }

  async findById(userId: string): Promise<AuthUser> {
    const rows = await this.db
      .select({
        id: appUsers.id,
        email: appUsers.email,
        nickname: appUsers.nickname,
        createdAt: appUsers.createdAt,
      })
      .from(appUsers)
      .where(eq(appUsers.id, sql`${userId}::uuid`))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    return this.toUserDto(rows[0]);
  }

  private signToken(userId: string): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 7 * 24 * 60 * 60;
    const payload = Buffer.from(
      JSON.stringify({ sub: userId, iat: now, exp: now + expiresIn }),
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  verifyToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;
      const headerData = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
      if (headerData.alg !== 'HS256' || headerData.typ !== 'JWT') return null;
      const expected = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');
      const sigBuf = Buffer.from(signature, 'base64url');
      const expBuf = Buffer.from(expected, 'base64url');
      if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (typeof data.sub !== 'string' || !data.sub || typeof data.exp !== 'number' || data.exp <= Math.floor(Date.now() / 1000)) return null;
      return data.sub;
    } catch {
      return null;
    }
  }

  private toUserDto(row: {
    id: string;
    email: string;
    nickname: string | null;
    createdAt: Date;
  }): AuthUser {
    return {
      id: row.id,
      email: row.email,
      nickname: row.nickname || row.email.split('@')[0],
      createdAt: row.createdAt.toISOString(),
    };
  }
}
