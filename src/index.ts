import cors from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import authRoutes from "./routes/auth";
import openapi from "@elysiajs/openapi";
import userRoutes from "./routes/user";
import { env } from "./utils/env";
import { rateLimit } from "elysia-rate-limit";
import { helmet } from "elysia-helmet";
import { logger } from "./utils/logger";

interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

const app = new Elysia()
  .use(helmet())
  .use(rateLimit())
  .use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      schema: t.Object({
        userId: t.String(),
      }),
    })
  )
  .use(openapi())
  .onRequest(({ request }) => {
    logger.info(
      {
        method: request.method,
        path: request.url,
        userAgent: request.headers.get("user-agent"),
      },
      "Incoming request"
    );
  })
  .get("/health", () => ({ status: "OK", service: "Cipher Auth" }))
  .use(authRoutes)
  .use(userRoutes)
  .onError(({ code, error, set, request }) => {
    const isStandardError = (e: unknown): e is Error => {
      return e instanceof Error;
    };

    // Type guard for Elysia's validation errors
    const isValidationError = (
      e: unknown
    ): e is { validator: string; schema: unknown; value: unknown } => {
      return typeof e === "object" && e !== null && "validator" in e;
    };

    // Get error message safely
    let errorMessage = "An unexpected error occurred";
    let errorStack: string | undefined;

    if (isStandardError(error)) {
      errorMessage = error.message;
      errorStack = error.stack;
    } else if (isValidationError(error)) {
      errorMessage = "Validation failed";
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    // Log the error with context
    logger.error(
      {
        msg: errorMessage,
        code,
        path: request.url,
        method: request.method,
        stack: errorStack,
      },
      "Request failed"
    );

    // Determine HTTP status code
    if (code === "NOT_FOUND") {
      set.status = 404;
    } else if (code === "VALIDATION") {
      set.status = 400;
      errorMessage = "Invalid request data"; // Override for validation errors
    } else if (code === "INTERNAL_SERVER_ERROR") {
      set.status = 500;
    } else {
      set.status = 500;
    }

    // Return standardized error response
    const errorResponse: ErrorResponse = {
      error: errorMessage,
      code: typeof code === "number" ? code.toString() : code,
    };

    // Only include stack trace in development
    if (process.env.NODE_ENV === "development" && errorStack) {
      errorResponse.details = errorStack;
    }

    return errorResponse;
  })
  .listen(Bun.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
