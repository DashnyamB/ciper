import { Redis } from "ioredis";

export const redis = new Redis(Bun.env.REDIS_URL || "redis://localhost:6379");
