import { Router } from "express";
import { PomodoroController } from "../controllers/PomodoroController";

const pomodoroRoutes = Router();
const pomodoroController = new PomodoroController();

pomodoroRoutes.get("/", (req, res) =>
  pomodoroController.getAllPomodoros(req, res)
);

pomodoroRoutes.get("/:id", (req, res) =>
  pomodoroController.getPomodoroById(req, res)
);

pomodoroRoutes.post("/", (req, res) =>
  pomodoroController.createPomodoro(req, res)
);

pomodoroRoutes.post("/:id/start", (req, res) =>
  pomodoroController.startPomodoro(req, res)
);

pomodoroRoutes.post("/:id/complete", (req, res) =>
  pomodoroController.completePomodoro(req, res)
);

pomodoroRoutes.post("/:id/interrupt", (req, res) =>
  pomodoroController.interruptPomodoro(req, res)
);

pomodoroRoutes.post("/:id/notes", (req, res) =>
  pomodoroController.addNotes(req, res)
);

export { pomodoroRoutes };
