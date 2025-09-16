import { redis } from '../lib/redis';
import { JWTType } from '../types/jwt';
import { AuthenticationError } from '../utils/errors';

interface AuthProtectArgs {
  token?: string;
  store: {
    userId: string;
  };
  jwt: JWTType;
}

export const authProtect = async ({ token, store, jwt }: AuthProtectArgs) => {
  if (!token) {
    throw new AuthenticationError('Authorization header missing or malformed');
  }

  const isBlacklisted = await redis.exists(`blacklist:${token}`);
  if (isBlacklisted) {
    throw new AuthenticationError('Token revoked');
  }

  const payload = await jwt.verify(token);

  if (!payload) {
    throw new AuthenticationError('Invalid or expired token');
  }

  store.userId = payload.userId;
};
