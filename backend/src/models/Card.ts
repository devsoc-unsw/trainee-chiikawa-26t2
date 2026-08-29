import { Schema, model } from "mongoose";

const cardSchema = new Schema({
  deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
  front: { type: String, required: true },
  back: { type: String, required: true },
  order: { type: Number, required: true },
}, { timestamps: true });

cardSchema.index({ deckId: 1, order: 1 });

export const Card = model("Card", cardSchema);