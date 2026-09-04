import { Schema, model } from "mongoose";

const userProfileSchema = new Schema({
  userId: { type: String, required: true, unique: true }, // Better Auth user id

  // XP & leveling
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  // Review streak
  reviewStreak: { type: Number, default: 0 },
  lastReviewDate: { type: Date, default: null },

  // Daily review tracking (reset each day)
  totalCardsReviewedToday: { type: Number, default: 0 },
  dailyReviewedCardIds: { type: [Schema.Types.ObjectId], default: [] },
  dailyResetDate: { type: Date, default: null },

  // Lifetime stats
  totalCardsReviewedAllTime: { type: Number, default: 0 },

  // Global user settings
  settings: {
    dailyNewCardLimit: { type: Number, default: 20 },
  }
}, { timestamps: true });


/**
 * Stores user-level statistics, XP, streaks, and settings.
 * Separate from Better Auth's user collection.
 */
export const UserProfile = model("UserProfile", userProfileSchema);
