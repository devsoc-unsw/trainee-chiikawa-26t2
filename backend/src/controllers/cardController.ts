import { Request, Response } from "express";
import * as cardsService from "../services/cardService.js";
import { errorHandler } from "../utils/errors.js";

export async function addCard(req: Request, res: Response) {
  try {
    const card = await cardsService.addCard(req.params.deckId as string, req.user!.id, req.body);
    res.status(201).json(card);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function updateCard(req: Request, res: Response) {
  try {
    const card = await cardsService.updateCard(req.params.deckId as string, req.params.cardId as string, req.user!.id, req.body);
    res.json(card);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function deleteCard(req: Request, res: Response) {
  try {
    await cardsService.deleteCard(req.params.deckId as string, req.params.cardId as string, req.user!.id);
    res.status(204).end();
  } catch (e) {
    errorHandler(e, req, res);
  }
}