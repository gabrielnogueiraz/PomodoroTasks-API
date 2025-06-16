import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { StreakController } from "../controllers/StreakController";

const router = Router();
const streakController = new StreakController();

router.use(authMiddleware);

router.get("/", streakController.getStreak);
router.post("/update", streakController.updateStreak);
router.post("/check-break", streakController.checkStreakBreak);
router.get("/stats", streakController.getStreakStats);

export default router;
