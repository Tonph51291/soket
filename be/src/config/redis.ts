import { EventEmitter } from "events";

type Expiration = {
  timer: NodeJS.Timeout;
};

type SetOptions = {
  EX?: number;
};

type SharedState = {
  store: Map<string, string>;
  expirations: Map<string, Expiration>;
  bus: EventEmitter;
};

const sharedState: SharedState = {
  store: new Map<string, string>(),
  expirations: new Map<string, Expiration>(),
  bus: new EventEmitter(),
};

class MemoryRedis extends EventEmitter {
  public status: "connecting" | "ready" | "end" = "ready";

  private readonly state: SharedState;

  private readonly subscriptions = new Map<string, (message: string) => void>();

  constructor(state: SharedState) {
    super();
    this.state = state;
  }

  public async connect(): Promise<void> {
    this.status = "ready";
  }

  public duplicate(): MemoryRedis {
    return new MemoryRedis(this.state);
  }

  public async quit(): Promise<"OK"> {
    this.status = "end";
    return "OK";
  }

  public async ping(): Promise<string> {
    return "PONG";
  }

  public async set(
    key: string,
    value: string,
    options?: SetOptions | "EX",
    ttlSeconds?: number,
  ): Promise<"OK"> {
    this.clearExpiration(key);
    this.state.store.set(key, value);

    const resolvedTtl = typeof options === "object" ? options.EX : ttlSeconds;
    if (resolvedTtl && resolvedTtl > 0) {
      const timer = setTimeout(() => {
        this.state.store.delete(key);
        this.state.expirations.delete(key);
      }, resolvedTtl * 1000);
      this.state.expirations.set(key, { timer });
    }

    return "OK";
  }

  public async get(key: string): Promise<string | null> {
    return this.state.store.get(key) ?? null;
  }

  public async del(key: string): Promise<number> {
    const existed = this.state.store.delete(key) ? 1 : 0;
    this.clearExpiration(key);
    return existed;
  }

  public async incr(key: string): Promise<number> {
    const currentValue = Number(this.state.store.get(key) ?? 0);
    const nextValue = currentValue + 1;
    this.state.store.set(key, String(nextValue));
    return nextValue;
  }

  public async expire(key: string, ttlSeconds: number): Promise<number> {
    if (!this.state.store.has(key)) {
      return 0;
    }

    this.clearExpiration(key);
    const timer = setTimeout(() => {
      this.state.store.delete(key);
      this.state.expirations.delete(key);
    }, ttlSeconds * 1000);
    this.state.expirations.set(key, { timer });
    return 1;
  }

  public async exists(key: string): Promise<number> {
    return this.state.store.has(key) ? 1 : 0;
  }

  public async publish(channel: string, message: string): Promise<number> {
    this.state.bus.emit(channel, message);
    return 1;
  }

  public async subscribe(...channels: string[]): Promise<"OK"> {
    for (const channel of channels) {
      if (this.subscriptions.has(channel)) {
        continue;
      }

      const handler = (message: string): void => {
        this.emit("message", channel, message);
      };

      this.subscriptions.set(channel, handler);
      this.state.bus.on(channel, handler);
    }

    return "OK";
  }

  public async unsubscribe(...channels: string[]): Promise<"OK"> {
    for (const channel of channels) {
      const handler = this.subscriptions.get(channel);
      if (!handler) {
        continue;
      }

      this.state.bus.off(channel, handler);
      this.subscriptions.delete(channel);
    }

    return "OK";
  }

  private clearExpiration(key: string): void {
    const expiration = this.state.expirations.get(key);
    if (!expiration) {
      return;
    }

    clearTimeout(expiration.timer);
    this.state.expirations.delete(key);
  }
}

export const redisClient = new MemoryRedis(sharedState);
export const redisPublisher = redisClient.duplicate();
export const redisSubscriber = redisClient.duplicate();

export const connectRedis = async (): Promise<void> => {
  await Promise.all([
    redisClient.connect(),
    redisPublisher.connect(),
    redisSubscriber.connect(),
  ]);
};

export const disconnectRedis = async (): Promise<void> => {
  await Promise.all([
    redisClient.quit(),
    redisPublisher.quit(),
    redisSubscriber.quit(),
  ]);
};
