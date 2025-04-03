import { Router, Request, Response } from "express";
import { PomodoroController } from "../controllers/PomodoroController";

const pomodoroRoutes = Router();
const pomodoroController = new PomodoroController();

pomodoroRoutes.get("/", (req: Request, res: Response) =>
  pomodoroController.getAllPomodoros(req, res)
);

pomodoroRoutes.get("/:id", (req: Request, res: Response) =>
  pomodoroController.getPomodoroById(req, res)
);

pomodoroRoutes.post("/", (req: Request, res: Response) =>
  pomodoroController.createPomodoro(req, res)
);

pomodoroRoutes.post("/:id/start", (req: Request, res: Response) =>
  pomodoroController.startPomodoro(req, res)
);

pomodoroRoutes.post("/:id/complete", (req: Request, res: Response) =>
  pomodoroController.completePomodoro(req, res)
);

pomodoroRoutes.post("/:id/interrupt", (req: Request, res: Response) =>
  pomodoroController.interruptPomodoro(req, res)
);

pomodoroRoutes.post("/:id/notes", (req: Request, res: Response) =>
  pomodoroController.addNotes(req, res)
);

export { pomodoroRoutes };
