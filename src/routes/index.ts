import { Router, Request, Response } from "express";
import { taskRoutes } from "./task.routes";
import { pomodoroRoutes } from "./pomodoro.routes";
import { authRoutes } from "./auth.routes";
import { flowerRoutes } from "./flower.routes";
import { lumiRoutes } from "./lumi.routes";

const routes = Router();

routes.use("/api/auth", authRoutes);
routes.use("/api/tasks", taskRoutes);
routes.use("/api/pomodoros", pomodoroRoutes);
routes.use("/api/flowers", flowerRoutes);
routes.use("/api/lumi", lumiRoutes);

routes.get("/", (req: Request, res: Response) => {
  res.json({ 
    message: "Pomodoro Tasks API with Lumi is running!",
    endpoints: {
      auth: "/api/auth",
      tasks: "/api/tasks", 
      pomodoros: "/api/pomodoros",
      flowers: "/api/flowers",
      lumi: "/api/lumi"
    }
  });
});

export { routes };
