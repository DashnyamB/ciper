import bearer from '@elysiajs/bearer';
import jwt from '@elysiajs/jwt';
import Elysia, { t } from 'elysia';
import { env } from '../utils/env';
import { adminGuard } from '../guards/admin-guard';
import { db } from '../lib/db';

const apiKeyRoutes = new Elysia({ prefix: '/admin/api-keys' })
  .state('userId', String())
  .use(bearer())
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      schema: t.Object({
        userId: t.String(),
      }),
    }),
  )
  .guard({
    beforeHandle: async ({ bearer, store, jwt }) => {
      await adminGuard({ token: bearer, store, jwt });
    },
  })
  .post(
    '',
    async ({ store }) => {
      const apiKey = await db.aPIKey.create({
        data: {
          userId: store.userId,
          name: 'Default name',
          key: crypto.randomUUID(),
        },
      });
      return { apiKey: apiKey.key };
    },
    {
      detail: {
        tags: ['api-keys'],
        summary: 'Create API Key',
      },
    },
  )
  .get(
    '',
    async ({ store }) => {
      const apiKeys = await db.aPIKey.findMany({
        where: { userId: store.userId },
        select: { id: true, name: true, key: true, createdAt: true },
      });
      return { apiKeys };
    },
    {
      detail: {
        tags: ['api-keys'],
        summary: 'List API Keys',
      },
    },
  );

export default apiKeyRoutes;
