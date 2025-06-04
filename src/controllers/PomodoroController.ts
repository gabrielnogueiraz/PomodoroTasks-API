import { Request, Response } from "express";
import { PomodoroService } from "../services/PomodoroService";

export class PomodoroController {
  private pomodoroService: PomodoroService;

  constructor() {
    this.pomodoroService = new PomodoroService();
  }

  async getAllPomodoros(req: Request, res: Response): Promise<void> {
    const taskId = req.query.taskId as string | undefined;

    const pomodoros = taskId
      ? await this.pomodoroService.findByTaskId(taskId)
      : await this.pomodoroService.findAll();

    res.json(pomodoros);
  }

  async getPomodoroById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const pomodoro = await this.pomodoroService.findById(id);

    if (!pomodoro) {
      res.status(404).json({ message: "Pomodoro not found" });
      return;
    }

    res.json(pomodoro);
  }

  async createPomodoro(req: Request, res: Response): Promise<void> {
    const { taskId, duration, notes } = req.body;

    if (!taskId) {
      res.status(400).json({ message: "Task ID is required" });
      return;
    }

    const pomodoro = await this.pomodoroService.create({
      taskId,
      duration,
      notes,
    });

    if (!pomodoro) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.status(201).json(pomodoro);
  }

  async startPomodoro(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const pomodoro = await this.pomodoroService.start(id);

    if (!pomodoro) {
      res.status(404).json({ message: "Pomodoro not found" });
      return;
    }

    res.json(pomodoro);
  }
  async completePomodoro(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const pomodoro = await this.pomodoroService.complete(id, userId);

    if (!pomodoro) {
      res.status(404).json({ message: "Pomodoro not found" });
      return;
    }

    res.json(pomodoro);
  }
  async interruptPomodoro(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const pomodoro = await this.pomodoroService.interrupt(id, userId, notes);

    if (!pomodoro) {
      res.status(404).json({ message: "Pomodoro not found" });
      return;
    }

    res.json(pomodoro);
  }

  async addNotes(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      res.status(400).json({ message: "Notes are required" });
      return;
    }

    const pomodoro = await this.pomodoroService.addNotes(id, notes);

    if (!pomodoro) {
      res.status(404).json({ message: "Pomodoro not found" });
      return;
    }

    res.json(pomodoro);
  }
}
