import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type MessageType = "text" | "image" | "file";

export type Message = {
  roomId: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  type: MessageType;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

export type MessageDocument = HydratedDocument<Message>;

const messageSchema = new Schema<Message>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 4000 },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      required: true,
      default: "text",
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ roomId: 1, createdAt: -1, _id: -1 });

export const MessageModel = model<Message>("Message", messageSchema);
