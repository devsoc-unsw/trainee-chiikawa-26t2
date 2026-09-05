import { Request, Response } from "express";
import * as reviewService from "../services/reviewService.js";
import { errorHandler } from "../utils/errors.js";
import { type ReviewMode, REVIEW_MODES } from "../utils/constants.js";

export async function getScheduledCards(req: Request, res: Response) {
  try {
    // Process missed reviews before returning scheduled cards
    await reviewService.processMissedReviews(req.user!.id, req.params.deckId as string);
    const result = await reviewService.getScheduledCards(req.user!.id, req.params.deckId as string);
    res.json(result);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function getAllDeckCards(req: Request, res: Response) {
  try {
    const cards = await reviewService.getAllDeckCardsForReview(req.user!.id, req.params.deckId as string);
    res.json(cards);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function previewDeckCards(req: Request, res: Response) {
  try {
    const cards = await reviewService.previewDeckCards(req.params.deckId as string, req.user?.id);
    res.json(cards);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function getReviewPreview(req: Request, res: Response) {
  try {
    const preview = await reviewService.getReviewPreview(
      req.user!.id,
      req.params.cardId as string,
      req.params.deckId as string,
    );
    res.json(preview);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function submitReview(req: Request, res: Response) {
  try {
    const { rating, reviewMode } = req.body ?? {};

    if (typeof rating !== "number") {
      return res.status(400).json({ error: "rating is required and must be a number (1-4)." });
    }

    const validModes: ReviewMode[] = [REVIEW_MODES.SCHEDULED, REVIEW_MODES.MANUAL, REVIEW_MODES.PREVIEW];
    if (!validModes.includes(reviewMode)) {
      return res.status(400).json({ error: "reviewMode must be 'scheduled', 'manual', or 'preview'." });
    }

    const result = await reviewService.submitReview(
      req.user!.id,
      req.params.cardId as string,
      req.params.deckId as string,
      rating,
      reviewMode,
    );
    res.json(result);
  } catch (e) {
    errorHandler(e, req, res);
  }
}
