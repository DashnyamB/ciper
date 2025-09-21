import jwt from '@elysiajs/jwt';
import Elysia, { t } from 'elysia';
import { env } from '../utils/env';
import bearer from '@elysiajs/bearer';
import { db } from '../lib/db';
import { NotFoundError } from '../utils/errors';
import { adminGuard } from '../guards/admin-guard';
import { SUPER_ADMIN_IDENTIFIER } from '../constants/super-admin';

const roleRoutes = new Elysia({ prefix: '/admin/roles' })
  .state('userId', String())
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      schema: t.Object({
        userId: t.String(),
      }),
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
      const { name, description, identifier } = body;

      if (identifier === SUPER_ADMIN_IDENTIFIER) {
        throw new Error('Cannot create role with reserved identifier');
      }

      const role = await db.role.create({
        data: { name: name ?? identifier, identifier, description },
      });
      return { id: role.id };
    },
    {
      detail: {
        tags: ['roles'],
        summary: 'Create a new role',
        description: 'Creates a new role with name and optional description',
      },
      body: t.Object({
        identifier: t.String(),
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
      response: t.Object({
        id: t.String(),
      }),
    },
  )
  .get(
    '',
    async () => {
      const roles = await db.role.findMany({
        where: { isDefault: false },
        select: {
          id: true,
          name: true,
          description: true,
          identifier: true,
        },
      });
      return roles;
    },
    {
      detail: {
        tags: ['roles'],
        summary: 'Get all roles',
        description: 'List all roles with their IDs, names, and descriptions',
      },
      response: t.Array(
        t.Object({
          id: t.String(),
          name: t.String(),
          identifier: t.String(),
          description: t.Optional(t.Union([t.String(), t.Null()])),
        }),
      ),
    },
  )
  .get('/:id', async ({ params }) => {
    const { id } = params;
    console.log(params);
    const role = await db.role.findUnique({
      where: { id, isDefault: false },
      omit: { isDefault: true },
      include: {
        RolePermission: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role');
    }
    return {
      ...role,
      permissions: role.RolePermission.map((rp) => rp.permission),
      RolePermission: undefined,
    };
  })
  .delete('/:id', async ({ params, set }) => {
    const { id } = params;
    const role = await db.role.findUnique({ where: { id, isDefault: false } });
    if (!role) {
      throw new NotFoundError('Role');
    }
    if (role.isDefault) {
      set.status = 400;
      return { error: 'Cannot delete a default role' };
    }

    await db.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
  })
  .put(
    '/:id',
    async ({ params, body }) => {
      const { id } = params;
      const { name, description } = body;

      const role = await db.role.findUnique({
        where: { id, isDefault: false },
      });
      if (!role) {
        throw new NotFoundError('Role');
      }

      const updatedRole = await db.role.update({
        where: { id },
        data: {
          name: name ?? role.name,
          description: description ?? role.description,
        },
      });

      return { id: updatedRole.id };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
    },
  )
  .post(
    '/:id/assign',
    async ({ params, body }) => {
      const { id } = params;
      const { permissionId } = body;

      const rolePermission = await db.rolePermission.findFirst({
        where: { roleId: id, permissionId },
      });

      if (rolePermission) {
        return { message: 'Permission already assigned to role' };
      }

      const role = await db.role.findUnique({ where: { id } });
      if (!role) {
        throw new NotFoundError('Role');
      }

      const permission = await db.permission.findUnique({
        where: { id: permissionId },
      });
      if (!permission) {
        throw new NotFoundError('Permission');
      }

      await db.role.update({
        where: { id },
        data: {
          RolePermission: {
            create: {
              permission: { connect: { id: permissionId } },
            },
          },
        },
      });

      return { message: 'Permission assigned to role successfully' };
    },
    {
      body: t.Object({
        permissionId: t.String(),
      }),
    },
  );

export default roleRoutes;
