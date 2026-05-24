import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";
import { ApiError } from "../utils/ApiError";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  getRefreshSession,
  revokeRefreshSession,
  storeRefreshSession,
} from "./sessionService";

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
};

export type AuthResult = {
  user: PublicUser;
  accessToken?: string;
  refreshToken?: string;
};

const toPublicUser = (user: {
  _id: { toString(): string };
  username: string;
  email: string;
  avatar?: string | null;
  createdAt: Date;
}): PublicUser => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  avatar: user.avatar ?? null,
  createdAt: user.createdAt,
});

const createSessionTokens = async (
  userId: string,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const { token: refreshToken, jti } = signRefreshToken(userId);
  const accessToken = signAccessToken({ id: userId, email: "", username: "" });

  await storeRefreshSession(jti, userId, refreshToken);
  return { accessToken, refreshToken };
};

export const registerUser = async (input: {
  username: string;
  email: string;
  password: string;
  avatar?: string | null;
}): Promise<AuthResult> => {
  const existingUser = await UserModel.findOne({
    $or: [{ email: input.email.toLowerCase() }, { username: input.username }],
  }).lean();
  if (existingUser) {
    throw new ApiError(
      409,
      "USER_EXISTS",
      "Tên đăng nhập hoặc email đã tồn tại",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await UserModel.create({
    username: input.username,
    email: input.email.toLowerCase(),
    passwordHash,
    avatar: input.avatar ?? null,
  });

  return { user: toPublicUser(user) };
};

export const loginUser = async (input: {
  email: string;
  password: string;
}): Promise<AuthResult> => {
  const user = await UserModel.findOne({
    email: input.email.toLowerCase(),
  }).select("+passwordHash");
  if (!user) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Email hoặc mật khẩu không đúng",
    );
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Email hoặc mật khẩu không đúng",
    );
  }

  const { token: refreshToken, jti } = signRefreshToken(user.id);
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  await storeRefreshSession(jti, user.id, refreshToken);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
};

export const refreshUserTokens = async (
  refreshToken: string,
): Promise<AuthResult> => {
  const decoded = verifyRefreshToken(refreshToken);
  const session = await getRefreshSession(decoded.jti);

  if (
    !session ||
    session.userId !== decoded.sub ||
    session.tokenHash !== hashToken(refreshToken)
  ) {
    throw new ApiError(
      401,
      "INVALID_REFRESH_TOKEN",
      "Refresh token không hợp lệ",
    );
  }

  await revokeRefreshSession(decoded.jti);

  const user = await UserModel.findById(decoded.sub).lean();
  if (!user) {
    throw new ApiError(401, "USER_NOT_FOUND", "Không tìm thấy người dùng");
  }

  const { token: nextRefreshToken, jti } = signRefreshToken(
    user._id.toString(),
  );
  const accessToken = signAccessToken({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
  });

  await storeRefreshSession(jti, user._id.toString(), nextRefreshToken);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken: nextRefreshToken,
  };
};

export const logoutUser = async (refreshToken: string): Promise<void> => {
  const decoded = verifyRefreshToken(refreshToken);
  await revokeRefreshSession(decoded.jti);
};

export const getCurrentUser = async (userId: string): Promise<PublicUser> => {
  const user = await UserModel.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "Người dùng không tồn tại");
  }

  return toPublicUser(user);
};

export const createAccessTokenForUser = async (
  userId: string,
): Promise<string> => {
  const user = await UserModel.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "Người dùng không tồn tại");
  }

  return signAccessToken({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
  });
};
