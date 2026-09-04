import { Request, Response } from "express";
import * as statsService from "../services/statsService.js";
import { errorHandler } from "../utils/errors.js";

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const stats = await statsService.getUserDashboardStats(req.user!.id);
    res.json(stats);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function getDeckStats(req: Request, res: Response) {
  try {
    const stats = await statsService.getDeckStats(req.user!.id, req.params.deckId as string);
    res.json(stats);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function getCardStats(req: Request, res: Response) {
  try {
    const stats = await statsService.getCardStats(req.user!.id, req.params.cardId as string);
    res.json(stats);
  } catch (e) {
    errorHandler(e, req, res);
  }
}
