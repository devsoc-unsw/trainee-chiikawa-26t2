import { Schema, model } from "mongoose";

export const FRIEND_REQUEST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
} as const;

export type FriendRequestStatus =
  (typeof FRIEND_REQUEST_STATUS)[keyof typeof FRIEND_REQUEST_STATUS];


const friendRequestSchema = new Schema(
  {
    requesterId: { type: String, required: true }, 
    recipientId: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(FRIEND_REQUEST_STATUS),
      default: FRIEND_REQUEST_STATUS.PENDING,
    },
  },
  { timestamps: true },
);

friendRequestSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
friendRequestSchema.index({ recipientId: 1, status: 1 });
friendRequestSchema.index({ requesterId: 1, status: 1 });

export const FriendRequest = model("FriendRequest", friendRequestSchema);
