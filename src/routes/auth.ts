import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { db } from "../lib/db";
import { getBearerToken } from "../utils";
import { redis } from "bun";
import { env } from "../utils/env";
import { rateLimit } from "elysia-rate-limit";

const authRoutes = new Elysia({ prefix: "/auth" })
  .use(rateLimit({ max: 5, duration: 60 * 1000 })) // 5 requests per minute
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      schema: t.Object({
        userId: t.String(),
      }),
    })
  )
  .post(
    "signup",
    async ({ body, jwt }) => {
      const { email, password } = body;
      const hashedPassword = await Bun.password.hash(password);

      const user = await db.user.create({
        data: { email, hashedPassword },
      });

      const token = await jwt.sign({
        userId: user.id,
        exp: env.ACCESS_TOKEN_EXPIRY,
      });
      return { token, user: { id: user.id, email: user.email } };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  .post(
    "signin",
    async ({ body, jwt, set }) => {
      const { email, password } = body;
      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        set.status = 401;
        return { error: "Invalid email or password" };
      }
      const isValid = await Bun.password.verify(password, user.hashedPassword);
      if (!isValid) {
        set.status = 401;
        return { error: "Invalid email or password" };
      }
      const token = await jwt.sign({
        userId: user.id,
        exp: env.ACCESS_TOKEN_EXPIRY,
      });
      return { token, user: { id: user.id, email: user.email } };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  .post(
    "logout",
    async ({ jwt, set, request }) => {
      const authHeader = request.headers.get("Authorization");
      const token = getBearerToken(authHeader);

      if (!token) {
        set.status = 400;
        return { error: "No token provided" };
      }

      const payload = await jwt.verify(token);
      if (!payload) {
        set.status = 400;
        return { error: "Invalid token" };
      }

      const expiry = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = expiry ? expiry - now : 0;
      console.log(expiry, now, ttl);

      if (ttl > 0) {
        // Here you would add the token to a blacklist store (e.g., Redis)
        // For demonstration, we'll just log it

        await redis.set(`blacklist:${token}`, "true", "EX", ttl);
      }

      return { message: "Logged out successfully" };
    },
    {
      beforeHandle: async ({ jwt, request, set }) => {
        // Reuse the same token verification logic from the guard
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;

        if (!token) {
          set.status = 401;
          return { error: "No token provided" };
        }

        const payload = await jwt.verify(token);
        if (!payload) {
          set.status = 401;
          return { error: "Invalid token" };
        }
      },
    }
  )
  .post(
    "/refresh",
    async ({ jwt, set, body }) => {
      const { refreshToken } = body;

      if (!refreshToken) {
        set.status = 400;
        return { error: "No token provided" };
      }

      const payload = await jwt.verify(refreshToken);
      if (!payload) {
        set.status = 400;
        return { error: "Invalid token" };
      }

      const storedToken = await db.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        set.status = 401;
        return { error: "Refresh token expired or revoked" };
      }

      const newAccessToken = await jwt.sign({
        userId: storedToken.user.id,
        exp: env.ACCESS_TOKEN_EXPIRY,
      });

      return { accessToken: newAccessToken };
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    }
  )
  .post(
    "/forgot-password",
    async ({ body, set }) => {
      const { email } = body;
      const user = await db.user.findUnique({ where: { email } });
      if (user) {
        const resetToken = crypto.randomUUID();

        await redis.set(`reset:${resetToken}`, user.id, "EX", 3600);

        console.log(`Password reset token for ${email}: ${resetToken}`);
      }

      return {
        message: "If that email is registered, a reset link has been sent.",
      };
    },
    {
      body: t.Object({ email: t.String({ format: "email" }) }),
    }
  )
  .post(
    "/reset-password",
    async ({ body }) => {
      const { resetToken, newPassword } = body;
      const userId = await redis.get(`reset:${resetToken}`);
      if (!userId) {
        return { error: "Invalid or expired reset token" };
      }

      const hashedPassword = await Bun.password.hash(newPassword);
      await db.user.update({
        where: { id: userId },
        data: { hashedPassword },
      });

      await redis.del(`reset:${resetToken}`);

      return { message: "Password has been reset successfully" };
    },
    {
      body: t.Object({
        resetToken: t.String(),
        newPassword: t.String({ minLength: 8 }),
      }),
    }
  );

export default authRoutes;
