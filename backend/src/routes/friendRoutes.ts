import { Router } from "express";
import * as friendController from "../controllers/friendController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router: Router = Router();

router.use(requireAuth);

router.get("/", friendController.listFriends);
router.get("/requests", friendController.listRequests);
router.post("/requests", friendController.sendRequest);
router.post("/requests/:requestId/accept", friendController.acceptRequest);
router.delete("/requests/:requestId", friendController.removeRequest);
router.delete("/:friendUserId", friendController.removeFriend);

export default router;
