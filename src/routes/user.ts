import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { db } from "../lib/db";
import { getBearerToken } from "../utils";
import { redis } from "bun";
import { env } from "../utils/env";
import { AuthenticationError, NotFoundError } from "../utils/errors";

const userRoutes = new Elysia()
  .state("userId", String())
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      schema: t.Object({
        userId: t.String(),
      }),
    })
  )
  .group("/users", (app) =>
    app.guard(
      {
        beforeHandle: async ({ jwt, request, set, store }) => {
          const authHeader = request.headers.get("Authorization");
          const token = getBearerToken(authHeader);

          if (!token) {
            throw new AuthenticationError(
              "Authorization header missing or malformed"
            );
          }

          const isBlacklisted = await redis.exists(`blacklist:${token}`);
          if (isBlacklisted) {
            throw new AuthenticationError("Token revoked");
          }

          const payload = await jwt.verify(token);

          if (!payload) {
            throw new AuthenticationError("Invalid or expired token");
          }

          store.userId = payload.userId;
        },
      },
      (app) =>
        app.post("/me", async ({ store, set }) => {
          const user = await db.user.findUnique({
            where: { id: store.userId },
            select: { id: true, email: true },
          });

          if (!user) {
            throw new NotFoundError("User");
          }

          return { userId: user.id, email: user.email };
        })
    )
  );

export default userRoutes;
