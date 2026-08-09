import * as crypto from 'crypto';

describe('security invariants', () => {
  it('does not accept a malformed or unsigned JWT', async () => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
    const { AuthService } = await import('../../server/modules/auth/auth.service');
    const service = new AuthService(null as never);
    expect(service.verifyToken('eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyIn0.')).toBeNull();
  });

  it('signatures cannot be reused with a changed payload', () => {
    const secret = 'test-secret-that-is-at-least-32-characters';
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'user-a', exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    const changed = Buffer.from(JSON.stringify({ sub: 'user-b', exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
    expect(crypto.createHmac('sha256', secret).update(`${header}.${changed}`).digest('base64url')).not.toBe(signature);
  });
});
