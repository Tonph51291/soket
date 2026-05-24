import { Schema, model, type HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

export type User = {
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

export const UserModel = model<User>("User", userSchema);
