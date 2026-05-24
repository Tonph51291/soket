import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { connectMongo, disconnectMongo } from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { createRealtimeGateway } from "./websocket/server";

const start = async (): Promise<void> => {
  await connectMongo();
  await connectRedis();

  const server = http.createServer(app);
  createRealtimeGateway(server);

  server.listen(env.PORT, () => {
    // Thông báo khởi động để dễ kiểm tra local.
    // eslint-disable-next-line no-console
    console.log(`Backend đang chạy tại http://localhost:${env.PORT}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await disconnectRedis();
    await disconnectMongo();
  };

  process.on("SIGINT", () => {
    void shutdown().then(() => process.exit(0));
  });

  process.on("SIGTERM", () => {
    void shutdown().then(() => process.exit(0));
  });
};

void start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Không thể khởi động backend:", error);
  process.exit(1);
});
