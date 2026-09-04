import { Schema, model } from "mongoose";

const cardStateSchema = new Schema({
  userId: { type: String, required: true },
  cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
  deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },

  fsrs: {
    difficulty: Number,
    due: Date,
    elapsed_days: Number,
    lapses: Number,
    last_review: Date,
    learning_steps: Number,
    reps: Number,
    scheduled_days: Number,
    stability: Number,
    state: { type: Number, default: 0 }, // ts-fsrs State enum: 0=New, 1=Learning, 2=Review, 3=Relearning
  },

  // Lantern status as a number 0–100, maps to Broken/Flickering/Low Fire/Blazing Bright
  lanternStatus: { type: Number, default: 50 },

  // How many scheduled reviews in a row were on time (for lantern upgrades, needs >=2)
  consecutiveOnTime: { type: Number, default: 0 },

  // Date of the last review that counted for statistics (one per day max)
  lastReviewDate: { type: Date, default: null },

  // Date of the last manual review that counted (separate tracking for once-per-day limit)
  lastManualReviewDate: { type: Date, default: null },

  // Total lifetime review count for this card by this user
  totalReviews: { type: Number, default: 0 },

}, { timestamps: true });

cardStateSchema.index({ userId: 1, cardId: 1 }, { unique: true });
cardStateSchema.index({ userId: 1, deckId: 1, "fsrs.due": 1 });
cardStateSchema.index({ userId: 1, deckId: 1, "fsrs.state": 1 });

/**
 * Card state represents the review state for a card. This is linked to a single user and a single card.
 * Stores information like fsrs info, lantern status, how many times the user has reviewed it, etc.
 */
export const CardState = model("CardState", cardStateSchema);