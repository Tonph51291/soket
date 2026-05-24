import { env } from "src/config/env";
import { redisClient } from "../config/redis";
import { durationToSeconds } from "../utils/duration";
import { hashToken } from "../utils/jwt";

const refreshKey = (jti: string): string => `refresh:${jti}`;

export type RefreshSession = {
  userId: string;
  tokenHash: string;
};

export const storeRefreshSession = async (
  jti: string,
  userId: string,
  refreshToken: string,
): Promise<void> => {
  const ttlSeconds = durationToSeconds(env.REFRESH_TOKEN_TTL);
  const payload: RefreshSession = {
    userId,
    tokenHash: hashToken(refreshToken),
  };

  await redisClient.set(
    refreshKey(jti),
    JSON.stringify(payload),
    "EX",
    ttlSeconds,
  );
};

export const getRefreshSession = async (
  jti: string,
): Promise<RefreshSession | null> => {
  const raw = await redisClient.get(refreshKey(jti));
  return raw ? (JSON.parse(raw) as RefreshSession) : null;
};

export const revokeRefreshSession = async (jti: string): Promise<void> => {
  await redisClient.del(refreshKey(jti));
};
