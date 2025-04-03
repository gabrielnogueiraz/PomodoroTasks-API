import { Router, Request, Response } from "express";
import { TaskController } from "../controllers/TaskController";

const taskRoutes = Router();
const taskController = new TaskController();

taskRoutes.get("/", (req: Request, res: Response) =>
  taskController.getAllTasks(req, res)
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

export { taskRoutes };
