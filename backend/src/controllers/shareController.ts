import { Request, Response } from "express";
import * as shareService from "../services/shareService.js";
import { errorHandler } from "../utils/errors.js";

export async function browseDecks(req: Request, res: Response) {
  try {
    const { query, tags, page, limit } = req.query;
    const result = await shareService.browsePublicDecks(
      query as string | undefined,
      tags ? (tags as string).split(",") : undefined,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 20,
    );
    res.json(result);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function cloneDeck(req: Request, res: Response) {
  try {
    const deck = await shareService.cloneDeck(req.user!.id, req.params.deckId as string);
    res.status(201).json(deck);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function favoriteDeck(req: Request, res: Response) {
  try {
    const result = await shareService.favoriteDeck(req.user!.id, req.params.deckId as string);
    res.json(result);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function getUserFavorites(req: Request, res: Response) {
  try {
    const favorites = await shareService.getUserFavorites(req.user!.id);
    res.json(favorites);
  } catch (e) {
    errorHandler(e, req, res);
  }
}
