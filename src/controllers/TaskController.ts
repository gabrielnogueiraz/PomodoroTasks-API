import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { TaskStatus, TaskPriority } from "../entities/Task";

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  async getAllTasks(req: Request, res: Response): Promise<void> {
    const status = req.query.status as TaskStatus | undefined;

    const tasks = status
      ? await this.taskService.findByStatus(status)
      : await this.taskService.findAll();

    res.json(tasks);
  }

  async getTaskById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const task = await this.taskService.findById(id);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json(task);
  }
  async createTask(req: Request, res: Response): Promise<void> {
    const taskData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    // Validação básica do formato de horário se fornecido
    if (taskData.startTime && !this.isValidTimeFormat(taskData.startTime)) {
      res
        .status(400)
        .json({ message: "Formato de horário inicial inválido. Use HH:mm" });
      return;
    }

    if (taskData.endTime && !this.isValidTimeFormat(taskData.endTime)) {
      res
        .status(400)
        .json({ message: "Formato de horário final inválido. Use HH:mm" });
      return;
    }

    // Associar o usuário à tarefa
    taskData.user = { id: userId };
    
    const task = await this.taskService.create(taskData);
    res.status(201).json(task);
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const taskData = req.body;

    // Validação básica do formato de horário se fornecido
    if (taskData.startTime && !this.isValidTimeFormat(taskData.startTime)) {
      res
        .status(400)
        .json({ message: "Formato de horário inicial inválido. Use HH:mm" });
      return;
    }

    if (taskData.endTime && !this.isValidTimeFormat(taskData.endTime)) {
      res
        .status(400)
        .json({ message: "Formato de horário final inválido. Use HH:mm" });
      return;
    }

    const updatedTask = await this.taskService.update(id, taskData);

    if (!updatedTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json(updatedTask);
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const success = await this.taskService.delete(id);

    if (!success) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.status(204).send();
  }

  async updateTaskStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(TaskStatus).includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const updatedTask = await this.taskService.updateStatus(id, status);

    if (!updatedTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json(updatedTask);
  }

  // Novo método para marcar como concluída
  async markAsCompleted(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const updatedTask = await this.taskService.markAsCompleted(id);

    if (!updatedTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json({
      message: "Tarefa marcada como concluída",
      task: updatedTask,
    });
  }

  // Novo método para desmarcar como concluída
  async markAsIncomplete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const updatedTask = await this.taskService.markAsIncomplete(id);

    if (!updatedTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json({
      message: "Tarefa desmarcada como concluída",
      task: updatedTask,
    });
  }

  // Método auxiliar para validar formato de horário
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
