import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { GoalController } from "../controllers/GoalController";

const router = Router();
const goalController = new GoalController();

router.use(authMiddleware);

router.post("/", goalController.createGoal);
router.get("/", goalController.getUserGoals);
router.put("/:goalId", goalController.updateGoal);
router.delete("/:goalId", goalController.deleteGoal);
router.get("/type/:type", goalController.getGoalsByType);
router.patch("/:goalId/progress", goalController.updateGoalProgress);
router.post("/check", goalController.checkGoals);

export default router;
