import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type RoomType = "private" | "group";

export type LastMessageSummary = {
  messageId: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  type: "text" | "image" | "file";
  createdAt: Date;
};

export type Room = {
  name: string;
  type: RoomType;
  members: Types.ObjectId[];
  lastMessage?: LastMessageSummary | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomDocument = HydratedDocument<Room>;

const lastMessageSchema = new Schema<LastMessageSummary>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: "Message" },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ["text", "image", "file"], required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const roomSchema = new Schema<Room>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
      default: "group",
    },
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: lastMessageSchema, default: null },
  },
  {
    timestamps: true,
  },
);

roomSchema.index({ members: 1 });
roomSchema.index({ updatedAt: -1 });

export const RoomModel = model<Room>("Room", roomSchema);
