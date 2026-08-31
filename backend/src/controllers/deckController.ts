import { Request, Response } from "express";
import * as decksService from "../services/deckService.js";
import { errorHandler, LearntenAPIError } from "../utils/errors.js";

export async function getDeck(req: Request, res: Response) {
  try {
    const deck = await decksService.getDeck(req.params.deckId as string, req.user?.id);
    res.json(deck);
  } catch (e) {
    if (e instanceof LearntenAPIError) {
      res.status(e.status).json({ error: e.message });
    }
  }

}

export async function getDeckCards(req: Request, res: Response) {
  try {
    const cards = await decksService.getDeckCards(req.params.deckId as string, req.user?.id);
    res.json(cards);
  } catch (e) {
    errorHandler(e, req, res);
  }
}


// these require auth
export async function createDeck(req: Request, res: Response) {
  try {
    const deck = await decksService.createDeck(req.user!.id, req.body);
    res.status(201).json(deck);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function updateDeck(req: Request, res: Response) {
  try {
    const deck = await decksService.updateDeck(req.params.deckId as string, req.user!.id, req.body);
    res.json(deck);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function deleteDeck(req: Request, res: Response) {
  try {
    await decksService.deleteDeck(req.params.deckId as string, req.user!.id);
    res.status(204).end();
  } catch (e) {
    errorHandler(e, req, res);
  }
}