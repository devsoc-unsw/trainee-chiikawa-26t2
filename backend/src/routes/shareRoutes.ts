import { Router } from "express";
import * as shareController from "../controllers/shareController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router: Router = Router();

/**
 * Browse and clone decks may be implemented later.
 * Browse search functionality perhaps with MongoDB Atlas Search later.
 */
// router.get("/browse", optionalAuth, shareController.browseDecks);
// router.post("/:deckId/clone", requireAuth, shareController.cloneDeck);

router.post("/:deckId/favorite", requireAuth, shareController.favoriteDeck);
router.get("/favorites", requireAuth, shareController.getUserFavorites);

export default router;
