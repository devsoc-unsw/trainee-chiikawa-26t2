import { Router } from "express";
import * as decksController from "../controllers/deckController.js";
import cardRoutes from "../routes/cardRoutes.js"
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router: Router = Router();

router.get("/:deckId", optionalAuth, decksController.getDeck);
router.get("/:deckId/cards", optionalAuth, decksController.getDeckCards);

router.post("/", requireAuth, decksController.createDeck);
router.put("/:deckId", requireAuth, decksController.updateDeck);
router.delete("/:deckId", requireAuth, decksController.deleteDeck);

router.use("/:deckId/cards", cardRoutes); 

export default router;
