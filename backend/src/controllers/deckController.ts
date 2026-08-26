import { Request, Response } from "express";
import * as decksService from "../services/deckService.js";

export async function getDeck(req: Request, res: Response) {
  const deck = await decksService.getDeck(req.params.deckId as string, req.user?.id);
  res.json(deck);
}

export async function getDeckCards(req: Request, res: Response) {
  const cards = await decksService.getDeck(req.params.deckId as string, req.user?.id);
  res.json(cards);
}


// these require auth
export async function createDeck(req: Request, res: Response) {
  const deck = await decksService.createDeck(req.user!.id, req.body);
  res.status(201).json(deck);
}

export async function updateDeck(req: Request, res: Response) {
  const deck = await decksService.updateDeck(req.params.deckId as string, req.user!.id, req.body);
  res.json(deck);
}

export async function deleteDeck(req: Request, res: Response) {
  const r = await decksService.deleteDeck(req.params.deckId as string, req.user!.id);
  if (r != null) {
    res.json(r);
    return;
  }
  res.status(204).end();
}