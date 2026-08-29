import { Router } from "express";
import * as cardsController from "../controllers/cardController.js";
import { requireAuth } from "../middleware/requireAuth.js";


const router: Router = Router({ mergeParams: true });

router.post("/", requireAuth, cardsController.addCard);
router.put("/:cardId", requireAuth, cardsController.updateCard);
router.delete("/:cardId", requireAuth, cardsController.deleteCard);

export default router;