import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { TaskStatus, TaskPriority } from "../entities/Task";

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }
  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as TaskStatus | undefined;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const tasks = status
        ? await this.taskService.findByStatus(status)
        : await this.taskService.findAll();

      // Filtrar apenas tarefas do usuário autenticado
      const userTasks = tasks.filter(task => task.user?.id === userId);

      // Formatar resposta para incluir boardId e goalId
      const formattedTasks = userTasks.map(task => ({
        ...task,
        boardId: task.kanbanBoard?.id || null,
        goalId: task.goal?.id || null,
        columnId: task.kanbanColumn?.id || null,
      }));

      res.json({
        success: true,
        tasks: formattedTasks
      });
    } catch (error: any) {
      console.error('Erro ao buscar tarefas:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Erro interno do servidor" 
      });
    }
  }

  async getTaskById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const task = await this.taskService.findById(id);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json(task);
  }  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const taskData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      // Validação de campos obrigatórios
      if (!taskData.title) {
        res.status(400).json({ message: "Título da tarefa é obrigatório" });
        return;
      }

      // Validação de boardId e goalId
      if (taskData.boardId && taskData.goalId) {
        res.status(400).json({ 
          message: "Tarefa não pode pertencer a quadro independente E meta simultaneamente" 
        });
        return;
      }

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

      taskData.user = { id: userId };

      const task = await this.taskService.create(taskData);
      
      // Formatar resposta para incluir boardId e goalId
      const response = {
        success: true,
        message: "Tarefa criada com sucesso",
        task: {
          ...task,
          boardId: task.kanbanBoard?.id || null,
          goalId: task.goal?.id || null,
          columnId: task.kanbanColumn?.id || null,
        }
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Erro interno do servidor" 
      });
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const taskData = req.body;

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

  async getTasksByBoard(req: Request, res: Response): Promise<void> {
    try {
      const { boardId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const tasks = await this.taskService.findByBoardId(boardId, userId);

      const formattedTasks = tasks.map(task => ({
        ...task,
        boardId: task.kanbanBoard?.id || null,
        goalId: task.goal?.id || null,
        columnId: task.kanbanColumn?.id || null,
      }));

      res.json({
        success: true,
        tasks: formattedTasks
      });
    } catch (error: any) {
      console.error('Erro ao buscar tarefas do quadro:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Erro interno do servidor" 
      });
    }
  }

  async getTasksByGoal(req: Request, res: Response): Promise<void> {
    try {
      const { goalId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const tasks = await this.taskService.findByGoalId(goalId, userId);

      const formattedTasks = tasks.map(task => ({
        ...task,
        boardId: task.kanbanBoard?.id || null,
        goalId: task.goal?.id || null,
        columnId: task.kanbanColumn?.id || null,
      }));

      res.json({
        success: true,
        tasks: formattedTasks
      });
    } catch (error: any) {
      console.error('Erro ao buscar tarefas da meta:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Erro interno do servidor" 
      });
    }
  }

  async getTasksByColumn(req: Request, res: Response): Promise<void> {
    try {
      const { columnId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const tasks = await this.taskService.findByColumnId(columnId, userId);

      const formattedTasks = tasks.map(task => ({
        ...task,
        boardId: task.kanbanBoard?.id || null,
        goalId: task.goal?.id || null,
        columnId: task.kanbanColumn?.id || null,
      }));

      res.json({
        success: true,
        tasks: formattedTasks
      });
    } catch (error: any) {
      console.error('Erro ao buscar tarefas da coluna:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Erro interno do servidor" 
      });
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
