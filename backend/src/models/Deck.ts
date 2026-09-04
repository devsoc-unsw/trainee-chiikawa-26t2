import { Schema, model, Types } from "mongoose";

const deckSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  isPublic: { type: Boolean, default: false },
  creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  cardCount: { type: Number, default: 0 },
  favoritedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
  tags: { type: [String], default: [] },
}, { timestamps: true });

deckSchema.index({ creator: 1 });
deckSchema.index({ isPublic: 1 });

export const Deck = model("Deck", deckSchema);