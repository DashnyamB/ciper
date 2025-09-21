import { cleanEnv, str, num, url } from 'envalid';

export const env = cleanEnv(Bun.env, {
  DATABASE_URL: url({
    default: 'postgresql://user:password@localhost:5432/cipher_auth',
  }),
  ACCESS_TOKEN_EXPIRY: str({ default: '15m' }),
  PORT: num({ default: 3000 }),
  REDIS_URL: url({ default: 'redis://localhost:6379' }),
  JWT_SECRET: str(),
  SUPER_ADMIN_EMAIL: str({ default: 'admin@test.com' }),
  SUPER_ADMIN_PASSWORD: str({ default: 'admin' }),
});
