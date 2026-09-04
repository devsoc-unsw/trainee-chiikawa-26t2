import { Router } from "express";
import * as reviewController from "../controllers/reviewController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router: Router = Router();

router.get("/:deckId/scheduled", requireAuth, reviewController.getScheduledCards);
router.get("/:deckId/all", requireAuth, reviewController.getAllDeckCards);
router.get("/:deckId/preview", optionalAuth, reviewController.previewDeckCards);
router.get("/:deckId/cards/:cardId/preview", requireAuth, reviewController.getReviewPreview);
router.post("/:deckId/cards/:cardId", requireAuth, reviewController.submitReview);

export default router;
