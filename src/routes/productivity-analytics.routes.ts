import { Router } from "express";
import { ProductivityAnalyticsController } from "../controllers/ProductivityAnalyticsController";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const analyticsController = new ProductivityAnalyticsController();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de analytics de produtividade
router.get("/insights", analyticsController.getProductivityInsights);

// Rotas internas para registro de métricas (chamadas pelo sistema)
router.post("/record/task-completion", analyticsController.recordTaskCompletion);
router.post("/record/pomodoro-session", analyticsController.recordPomodoroSession);
router.post("/record/goal-progress", analyticsController.recordGoalProgress);

export { router as productivityAnalyticsRoutes };
