import { Router, Request, Response } from "express";
import { taskRoutes } from "./task.routes";
import { pomodoroRoutes } from "./pomodoro.routes";

const routes = Router();

routes.use("/api/tasks", taskRoutes);
routes.use("/api/pomodoros", pomodoroRoutes);

routes.get("/", (req: Request, res: Response) => {
  res.json({ message: "Pomodoro Tasks API is running!" });
});

export { routes };
