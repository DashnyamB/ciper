import jwt from '@elysiajs/jwt';
import Elysia, { t } from 'elysia';
import { db } from '../lib/db';
import { env } from '../utils/env';
import { NotFoundError } from '../utils/errors';
import { JWTPayloadT } from '../types/jwt';
import { authProtect } from '../guards/auth-guard';
import bearer from '@elysiajs/bearer';
import { publicKeyValidator } from '../middleware/public-api-key-validator';

const userRoutes = new Elysia({ prefix: '/users' })
  // .use(rateLimit({ max: 10, duration: 60 * 1000 })) // 10 requests per minute
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
      await authProtect({ token: bearer, store, jwt });
    },
  })
  .guard({
    beforeHandle: async ({ request }) => {
      await publicKeyValidator({ request });
    },
  })
  .post(
    '/me',
    async ({ store }) => {
      const user = await db.user.findUnique({
        where: { id: store.userId },
        select: {
          id: true,
          email: true,
          role: {
            select: {
              id: true,
              name: true,
              identifier: true,
              description: true,
              RolePermission: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
        // include: { role: true },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      return {
        ...user,
        role: {
          ...user.role,
          permissions: user.role?.RolePermission.map((rp) => rp.permission),
          RolePermission: undefined,
        },
      };
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Get user information',
        description:
          'Retrieves the information of the currently authenticated user',
      },
    },
  )
  .post(
    '/:id/assign-role',
    async ({ params, body }) => {
      const { id } = params;
      const { roleId } = body;

      const user = await db.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundError('User');
      }

      const role = await db.role.findUnique({ where: { id: roleId } });
      if (!role) {
        throw new NotFoundError('Role');
      }

      await db.user.update({
        where: { id },
        data: {
          role: { connect: { id: roleId } },
        },
      });
      return { message: 'Role assigned to user successfully' };
    },
    {
      body: t.Object({
        roleId: t.String(),
      }),
      detail: {
        tags: ['Users'],
        summary: 'Assign role to user',
        description: 'Assigns a role to a user by their IDs',
      },
    },
  );

export default userRoutes;
