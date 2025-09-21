import jwt from '@elysiajs/jwt';
import { JWTPayloadT } from '../types/jwt';
import { env } from '../utils/env';
import bearer from '@elysiajs/bearer';
import Elysia, { t } from 'elysia';
import { db } from '../lib/db';
import { adminGuard } from '../guards/admin-guard';

const permissionRoutes = new Elysia({ prefix: '/admin/permissions' })
  .state('userId', String())
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      schema: JWTPayloadT,
    }),
  )
  .use(bearer())
  .guard({
    beforeHandle: async ({ bearer, store, jwt }) => {
      await adminGuard({ token: bearer, store, jwt });
    },
  })
  .post(
    '',
    async ({ body }) => {
      const { name, description } = body;
      const permission = await db.permission.create({
        data: { name, description },
      });

      return { id: permission.id };
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
      }),
    },
  )
  .delete('/:id', async ({ params }) => {
    const { id } = params;
    await db.permission.delete({ where: { id } });
    return { success: true };
  });

export default permissionRoutes;
