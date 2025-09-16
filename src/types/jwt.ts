import { t, Static } from 'elysia';

export const JWTPayloadT = t.Object({
  userId: t.String(),
});

type JWTPayload = Static<typeof JWTPayloadT>;

export type JWTType = {
  readonly sign: (payload: JWTPayload) => Promise<string>;
  readonly verify: (
    payload?: string | undefined,
  ) => Promise<false | JWTPayload>;
};
