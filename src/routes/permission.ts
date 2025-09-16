import jwt from '@elysiajs/jwt';
import { JWTPayloadT } from '../types/jwt';
import { env } from '../utils/env';
import bearer from '@elysiajs/bearer';
import { authProtect } from '../guards/auth-guard';
import Elysia, { t } from 'elysia';
import { db } from '../lib/db';

const permissionRoutes = new Elysia({ prefix: '/permissions' })
  .state('userId', String())
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      schema: JWTPayloadT,
    }),
  )
  .use(bearer())
  //   .guard({
  //     beforeHandle: async ({ bearer, store, jwt }) => {
  //       await authProtect({ token: bearer, store, jwt });
  //     },
  //   })
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
  );

export default permissionRoutes;
