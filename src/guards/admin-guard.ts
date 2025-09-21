import { SUPER_ADMIN_IDENTIFIER } from '../constants/super-admin';
import { db } from '../lib/db';
import { JWTType } from '../types/jwt';
import { authProtect } from './auth-guard';

interface AdminProtectArgs {
  token?: string;
  store: {
    userId: string;
  };
  jwt: JWTType;
}

export const adminGuard = async (args: AdminProtectArgs): Promise<void> => {
  const userId = await authProtect(args);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: { select: { identifier: true } } },
  });

  if (user?.role?.identifier !== SUPER_ADMIN_IDENTIFIER) {
    throw new Error('Admin privileges required');
  }
};
