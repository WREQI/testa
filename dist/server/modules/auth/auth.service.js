"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const fullstack_nestjs_core_1 = require("@lark-apaas/fullstack-nestjs-core");
const drizzle_orm_1 = require("drizzle-orm");
const crypto = tslib_1.__importStar(require("crypto"));
const schema_1 = require("../../database/schema");
const JWT_SECRET = process.env.JWT_SECRET || 'stocklab_jwt_secret_key_dev_2024';
const SALT_LEN = 16;
const HASH_ITERATIONS = 10000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';
function hashPassword(password) {
    const salt = crypto.randomBytes(SALT_LEN).toString('hex');
    const derived = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');
    return `pbkdf2_sha512$${HASH_ITERATIONS}$${salt}$${derived}`;
}
function verifyPassword(password, stored) {
    try {
        const parts = stored.split('$');
        if (parts.length !== 4)
            return false;
        const [, iterStr, salt, derived] = parts;
        const iterations = parseInt(iterStr, 10);
        const computed = crypto.pbkdf2Sync(password, salt, iterations, HASH_KEYLEN, HASH_DIGEST).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(derived));
    }
    catch {
        return false;
    }
}
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
let AuthService = class AuthService {
    db;
    constructor(db) {
        this.db = db;
    }
    async register(dto) {
        const email = dto.email?.trim().toLowerCase();
        const password = dto.password;
        if (!email || !validateEmail(email)) {
            throw new common_1.BadRequestException('邮箱格式不正确');
        }
        if (!password || password.length < 6) {
            throw new common_1.BadRequestException('密码长度至少6位');
        }
        const existing = await this.db
            .select({ id: schema_1.appUsers.id })
            .from(schema_1.appUsers)
            .where((0, drizzle_orm_1.eq)(schema_1.appUsers.email, (0, drizzle_orm_1.sql) `lower(${email})`))
            .limit(1);
        if (existing.length > 0) {
            throw new common_1.BadRequestException('该邮箱已被注册');
        }
        const passwordHash = hashPassword(password);
        const nickname = email.split('@')[0];
        const [user] = await this.db
            .insert(schema_1.appUsers)
            .values({
            email,
            passwordHash,
            nickname,
        })
            .returning({
            id: schema_1.appUsers.id,
            email: schema_1.appUsers.email,
            nickname: schema_1.appUsers.nickname,
            createdAt: schema_1.appUsers.createdAt,
        });
        const token = this.signToken(user.id);
        return {
            user: this.toUserDto(user),
            token,
        };
    }
    async login(dto) {
        const email = dto.email?.trim().toLowerCase();
        const password = dto.password;
        if (!email || !password) {
            throw new common_1.BadRequestException('邮箱和密码不能为空');
        }
        const rows = await this.db
            .select({
            id: schema_1.appUsers.id,
            email: schema_1.appUsers.email,
            nickname: schema_1.appUsers.nickname,
            passwordHash: schema_1.appUsers.passwordHash,
            createdAt: schema_1.appUsers.createdAt,
        })
            .from(schema_1.appUsers)
            .where((0, drizzle_orm_1.eq)(schema_1.appUsers.email, (0, drizzle_orm_1.sql) `lower(${email})`))
            .limit(1);
        if (rows.length === 0) {
            throw new common_1.UnauthorizedException('邮箱或密码错误');
        }
        const user = rows[0];
        if (!verifyPassword(password, user.passwordHash)) {
            throw new common_1.UnauthorizedException('邮箱或密码错误');
        }
        const token = this.signToken(user.id);
        return {
            user: this.toUserDto(user),
            token,
        };
    }
    async findById(userId) {
        const rows = await this.db
            .select({
            id: schema_1.appUsers.id,
            email: schema_1.appUsers.email,
            nickname: schema_1.appUsers.nickname,
            createdAt: schema_1.appUsers.createdAt,
        })
            .from(schema_1.appUsers)
            .where((0, drizzle_orm_1.eq)(schema_1.appUsers.id, (0, drizzle_orm_1.sql) `${userId}::uuid`))
            .limit(1);
        if (rows.length === 0) {
            throw new common_1.NotFoundException('用户不存在');
        }
        return this.toUserDto(rows[0]);
    }
    signToken(userId) {
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = 7 * 24 * 60 * 60;
        const payload = Buffer.from(JSON.stringify({ sub: userId, iat: now, exp: now + expiresIn })).toString('base64url');
        const signature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');
        return `${header}.${payload}.${signature}`;
    }
    verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3)
                return null;
            const [header, payload, signature] = parts;
            const expected = crypto
                .createHmac('sha256', JWT_SECRET)
                .update(`${header}.${payload}`)
                .digest('base64url');
            const sigBuf = Buffer.from(signature, 'base64url');
            const expBuf = Buffer.from(expected, 'base64url');
            if (!crypto.timingSafeEqual(sigBuf, expBuf))
                return null;
            const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
            if (data.exp && data.exp < Math.floor(Date.now() / 1000))
                return null;
            return data.sub || null;
        }
        catch {
            return null;
        }
    }
    toUserDto(row) {
        return {
            id: row.id,
            email: row.email,
            nickname: row.nickname || row.email.split('@')[0],
            createdAt: row.createdAt.toISOString(),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_2.Inject)(fullstack_nestjs_core_1.DRIZZLE_DATABASE)),
    tslib_1.__metadata("design:paramtypes", [Function])
], AuthService);
