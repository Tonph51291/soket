type CursorPayload = {
  createdAt: string;
  id: string;
};

export const encodeCursor = (payload: CursorPayload): string =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

export const decodeCursor = (cursor: string): CursorPayload => {
  const raw = Buffer.from(cursor, "base64url").toString("utf8");
  return JSON.parse(raw) as CursorPayload;
};
