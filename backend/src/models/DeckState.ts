import { Schema, model } from "mongoose";

const deckStateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
  mode: { type: String, enum: ["normal", "fsrs"], required: true },
}, { timestamps: true });

deckStateSchema.index({ userId: 1, deckId: 1 }, { unique: true });

export const DeckSettings = model("DeckState", deckStateSchema);