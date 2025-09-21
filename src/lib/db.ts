import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';
import { ensureSuperAdmin } from './setup';

export const db = new PrismaClient();

const initialize = async () => {
  try {
    // Test database connection
    await db.$connect();
    logger.info('Database connected successfully');

    // Create super admin
    await ensureSuperAdmin();
    logger.info('Super admin initialization completed');
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Failed to initialize database: ' + error.message);
    } else {
      logger.error('Failed to initialize database: ' + JSON.stringify(error));
    }
    process.exit(1);
  }
};

initialize();
