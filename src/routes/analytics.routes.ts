import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { AnalyticsController } from "../controllers/AnalyticsController";

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authMiddleware);

router.get("/", analyticsController.getAnalytics);
router.post("/daily", analyticsController.updateDailyPerformance);
router.get("/daily/:date", analyticsController.getDailyPerformance);

export default router;
