import { db } from './db';
import { env } from '../utils/env';
import { SUPER_ADMIN_IDENTIFIER } from '../constants/super-admin';

export const ensureSuperAdmin = async () => {
  const existingAdmin = await db.user.findUnique({
    where: { email: env.SUPER_ADMIN_EMAIL },
  });

  if (existingAdmin && existingAdmin.roleId) {
    return;
  }

  let superAdminRole = await db.role.findFirst({
    where: { identifier: SUPER_ADMIN_IDENTIFIER },
  });

  if (!superAdminRole) {
    superAdminRole = await db.role.create({
      data: {
        name: 'Ciper Super Admin',
        identifier: SUPER_ADMIN_IDENTIFIER,
        description: 'Super admin with all permissions',
        isDefault: true,
      },
    });
  }

  if (existingAdmin) {
    await db.user.update({
      where: { id: existingAdmin.id },
      data: { roleId: superAdminRole.id },
    });
    return;
  }

  const hashedPassword = await Bun.password.hash(env.SUPER_ADMIN_PASSWORD);

  await db.user.create({
    data: {
      email: env.SUPER_ADMIN_EMAIL,
      hashedPassword: hashedPassword,
      role: { connect: { id: superAdminRole.id } },
    },
  });
};
