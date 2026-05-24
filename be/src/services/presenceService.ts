import { redisClient, redisPublisher } from "../config/redis";

const presenceKey = (userId: string): string => `presence:user:${userId}`;
export const PRESENCE_CHANNEL = "presence:events";

export const setUserOnline = async (
  userId: string,
  username: string,
): Promise<void> => {
  await redisClient.set(presenceKey(userId), username, "EX", 60);
  await redisPublisher.publish(
    PRESENCE_CHANNEL,
    JSON.stringify({ event: "user_online", data: { userId } }),
  );
};

export const refreshUserPresence = async (
  userId: string,
  username: string,
): Promise<void> => {
  await redisClient.set(presenceKey(userId), username, "EX", 60);
};

export const setUserOffline = async (userId: string): Promise<void> => {
  await redisClient.del(presenceKey(userId));
  await redisPublisher.publish(
    PRESENCE_CHANNEL,
    JSON.stringify({ event: "user_offline", data: { userId } }),
  );
};

export const isUserOnline = async (userId: string): Promise<boolean> =>
  (await redisClient.exists(presenceKey(userId))) === 1;
