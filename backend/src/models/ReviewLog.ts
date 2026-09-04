import { Schema, model } from "mongoose";

const reviewLogSchema = new Schema({
  userId: { type: String, required: true },
  cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
  deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },

  rating: { type: Number, required: true, min: 1, max: 4 }, // 1=Again, 2=Hard, 3=Good, 4=Easy
  reviewMode: {
    type: String,
    enum: ["scheduled", "manual", "preview"],
    required: true,
  },

  // State transitions
  previousState: Number,
  newState: Number,
  previousStability: Number,
  newStability: Number,

  scheduledDays: Number,
  elapsedDays: Number,
  xpEarned: { type: Number, default: 0 },
}, { timestamps: true });

reviewLogSchema.index({ userId: 1, deckId: 1, createdAt: -1 });
reviewLogSchema.index({ userId: 1, cardId: 1, createdAt: -1 });

/**
 * Stores individual review events for history and analytics.
 */
export const ReviewLog = model("ReviewLog", reviewLogSchema);
