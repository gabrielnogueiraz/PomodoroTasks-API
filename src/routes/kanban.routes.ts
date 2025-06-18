import { Router } from "express";
import { KanbanController } from "../controllers/KanbanController";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const kanbanController = new KanbanController();

router.use(authMiddleware);

router.post("/boards", kanbanController.createStandaloneBoard);
router.post("/boards/goal/:goalId", kanbanController.createBoardForGoal);
router.get("/boards", kanbanController.getUserBoards);
router.get("/boards/:boardId", kanbanController.getBoardById);
router.get("/boards/goal/:goalId", kanbanController.getBoardByGoal);
router.put("/boards/:boardId", kanbanController.updateBoard);
router.delete("/boards/:boardId", kanbanController.deleteBoard);

router.post("/boards/:boardId/columns", kanbanController.createColumn);
router.put("/columns/:columnId", kanbanController.updateColumn);
router.delete("/columns/:columnId", kanbanController.deleteColumn);
router.put("/boards/:boardId/columns/reorder", kanbanController.reorderColumns);

router.put("/tasks/:taskId/move", kanbanController.moveTask);

export { router as kanbanRoutes };
