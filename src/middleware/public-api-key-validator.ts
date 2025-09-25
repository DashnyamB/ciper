import { db } from '../lib/db';
import { APIKeyError, AuthenticationError } from '../utils/errors';

export const publicKeyValidator = async ({ request }: any) => {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    throw new APIKeyError('API key is missing');
  }

  const publicKey = await db.aPIKey.findUnique({ where: { key: apiKey } });

  if (!publicKey) {
    throw new APIKeyError('Invalid API key');
  }
};
