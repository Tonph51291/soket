import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "src/config/env";

export type JwtUser = {
  id: string;
  email: string;
  username: string;
};

type AccessTokenPayload = JwtUser & {
  tokenType: "access";
};

type RefreshTokenPayload = {
  sub: string;
  jti: string;
  tokenType: "refresh";
};

export const signAccessToken = (user: JwtUser): string =>
  jwt.sign(
    { ...user, tokenType: "access" } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
    },
  );

export const signRefreshToken = (
  userId: string,
): { token: string; jti: string } => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: userId, jti, tokenType: "refresh" } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"],
    },
  );

  return { token, jti };
};

export const verifyAccessToken = (token: string): JwtUser => {
  const decoded = jwt.verify(
    token,
    env.JWT_ACCESS_SECRET,
  ) as AccessTokenPayload;
  return {
    id: decoded.id,
    email: decoded.email,
    username: decoded.username,
  };
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");
