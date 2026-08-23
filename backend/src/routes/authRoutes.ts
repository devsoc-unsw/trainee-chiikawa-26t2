import { Router } from "express";
import { loginController, registerController } from "../controllers/authController.js";

const router: Router = Router();

router.post("/register", registerController);
router.post("/login", loginController);

export default router;
