import { Router } from "express";
import * as statsController from "../controllers/statsController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router: Router = Router();

router.get("/dashboard", requireAuth, statsController.getDashboardStats);
router.get("/decks/:deckId", requireAuth, statsController.getDeckStats);
router.get("/cards/:cardId", requireAuth, statsController.getCardStats);

export default router;
