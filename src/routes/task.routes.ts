import { Router, Request, Response } from "express";
import { TaskController } from "../controllers/TaskController";
import { authMiddleware } from "../middleware/auth";

const taskRoutes = Router();
const taskController = new TaskController();

taskRoutes.use(authMiddleware);

taskRoutes.get("/", (req: Request, res: Response) =>
  taskController.getAllTasks(req, res)
);

taskRoutes.get("/board/:boardId", (req: Request, res: Response) =>
  taskController.getTasksByBoard(req, res)
);

taskRoutes.get("/goal/:goalId", (req: Request, res: Response) =>
  taskController.getTasksByGoal(req, res)
);

taskRoutes.get("/column/:columnId", (req: Request, res: Response) =>
  taskController.getTasksByColumn(req, res)
);

taskRoutes.get("/:id", (req: Request, res: Response) =>
  taskController.getTaskById(req, res)
);

taskRoutes.post("/", (req: Request, res: Response) =>
  taskController.createTask(req, res)
);

taskRoutes.put("/:id", (req: Request, res: Response) =>
  taskController.updateTask(req, res)
);

taskRoutes.delete("/:id", (req: Request, res: Response) =>
  taskController.deleteTask(req, res)
);

taskRoutes.patch("/:id/status", (req: Request, res: Response) =>
  taskController.updateTaskStatus(req, res)
);

taskRoutes.patch("/:id/complete", (req: Request, res: Response) =>
  taskController.markAsCompleted(req, res)
);

taskRoutes.patch("/:id/incomplete", (req: Request, res: Response) =>
  taskController.markAsIncomplete(req, res)
);

export { taskRoutes };
