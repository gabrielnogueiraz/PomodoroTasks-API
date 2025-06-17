import { Router } from "express";
import { KanbanController } from "../controllers/KanbanController";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const kanbanController = new KanbanController();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de quadros
router.post("/boards/goal/:goalId", kanbanController.createBoardForGoal);
router.get("/boards/goal/:goalId", kanbanController.getBoardByGoal);
router.get("/boards", kanbanController.getUserBoards);
router.put("/boards/:boardId", kanbanController.updateBoard);
router.delete("/boards/:boardId", kanbanController.deleteBoard);

// Rotas de colunas
router.post("/boards/:boardId/columns", kanbanController.createColumn);
router.put("/columns/:columnId", kanbanController.updateColumn);
router.delete("/columns/:columnId", kanbanController.deleteColumn);
router.put("/boards/:boardId/columns/reorder", kanbanController.reorderColumns);

// Rotas de tarefas
router.put("/tasks/:taskId/move", kanbanController.moveTask);

export { router as kanbanRoutes };
