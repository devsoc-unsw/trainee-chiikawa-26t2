import { Schema, model } from "mongoose";

const cardStateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
  deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
  mode: { type: String, enum: ["fsrs", "normal"], required: true },
  reviewsCount: { type: Number, default: 0 },

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
    state: { type: String, enum: ["New", "Learning", "Review", "Relearning"] },
  },

  normal: {
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastResult: { type: String, enum: ["correct", "incorrect"] },
    lastReviewedAt: Date,
  },
}, { timestamps: true });

cardStateSchema.index({ userId: 1, cardId: 1 }, { unique: true });
cardStateSchema.index({ userId: 1, deckId: 1, "fsrs.due": 1 });

/**
 * Card state represents the review state for a card. This is linked to a single user and a single card
 * Stores information like fsrs info, how many times the user has reviewed it, etc.
 */
export const CardState = model("CardState", cardStateSchema);