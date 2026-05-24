import { UserModel } from "../models/User";
import { ApiError } from "../utils/ApiError";
import type { PublicUser } from "./authService";

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

export const getMe = async (userId: string): Promise<PublicUser> => {
  const user = await UserModel.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "Người dùng không tồn tại");
  }

  return toPublicUser(user);
};

export const getUserById = async (userId: string): Promise<PublicUser> => {
  const user = await UserModel.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "Người dùng không tồn tại");
  }

  return toPublicUser(user);
};

export const searchUsers = async (query: string): Promise<PublicUser[]> => {
  if (!query.trim()) {
    return [];
  }

  const users = await UserModel.find({
    $or: [
      { username: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  })
    .limit(20)
    .sort({ username: 1 })
    .lean();

  return users.map(toPublicUser);
};
