import { Card } from "../models/Card.js";
import { assertOwnsDeck } from "../utils/deckUtils.js";
import { LearntenAPIError } from "../utils/errors.js";

export async function addCard(deckId: string, userId: string, data: { front: string; back: string; }) {
  const deck = await assertOwnsDeck(deckId, userId);
  const order = deck.cardCount;
  const card = await Card.create({ deckId, ...data, order });
  deck.cardCount += 1;
  await deck.save();
  return card;
}

export async function updateCard(deckId: string, cardId: string, userId: string, updates: Partial<{ front: string; back: string; }>) {
  await assertOwnsDeck(deckId, userId);
  const card = await Card.findOneAndUpdate({ _id: cardId, deckId }, updates, { new: true });
  if (!card) throw new LearntenAPIError("Card not found.", 404);
  return card;
}

export async function deleteCard(deckId: string, cardId: string, userId: string) {
  const deck = await assertOwnsDeck(deckId, userId);
  const card = await Card.findOneAndDelete({ _id: cardId, deckId });
  if (!card) throw new LearntenAPIError("Card not found.", 404);

  deck.cardCount = Math.max(0, deck.cardCount - 1);
  await deck.save();
}