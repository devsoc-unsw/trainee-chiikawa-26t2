import { Schema, model } from "mongoose";

const deckStateSchema = new Schema({
  userId: { type: String, required: true },
  deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },

  // FSRS settings (per user per deck)
  desiredRetention: { type: Number, default: 0.9 },

  // Daily new card limits
  dailyNewCardLimit: { type: Number, default: 20 },
  newCardsIntroducedToday: { type: Number, default: 0 },
  newCardsResetDate: { type: Date, default: null },

  // Deck mastery
  isRefinedLantern: { type: Boolean, default: false },
}, { timestamps: true });

deckStateSchema.index({ userId: 1, deckId: 1 }, { unique: true });

/**
 * Per-user per-deck settings and state.
 * Stores FSRS config overrides, daily new card tracking, and refined lantern status.
 */
export const DeckState = model("DeckState", deckStateSchema);