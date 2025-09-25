import { db } from '../lib/db';
import { APIKeyError, AuthenticationError } from '../utils/errors';

export const privateKeyValidator = async ({ request }: any) => {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    throw new APIKeyError('API key is missing');
  }

  const secretKey = await db.aPIKey.findUnique({ where: { secret: apiKey } });

  if (!secretKey) {
    throw new APIKeyError('Invalid API key');
  }
};
