import { AppDataSource } from "../data-source";
import { Task, TaskPriority, TaskStatus } from "../entities/Task";
import { Repository, Between } from "typeorm";
import { StreakService } from "./StreakService";
import { AnalyticsService } from "./AnalyticsService";
import { GoalService } from "./GoalService";
import { ProductivityAnalyticsService } from "./ProductivityAnalyticsService";
import { GoalCategory } from "../entities/Goal";

export class TaskService {
  private taskRepository: Repository<Task>;
  private streakService: StreakService;
  private analyticsService: AnalyticsService;
  private goalService: GoalService;
  private productivityAnalyticsService: ProductivityAnalyticsService;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
    this.streakService = new StreakService();
    this.analyticsService = new AnalyticsService();
    this.goalService = new GoalService();
    this.productivityAnalyticsService = new ProductivityAnalyticsService();
  }
  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      relations: ["pomodoros"],
      select: ["id", "title", "description", "status", "priority", "estimatedPomodoros", "completedPomodoros", "createdAt", "updatedAt"],
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({
      where: { id },
      relations: ["pomodoros"],
    });
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.taskRepository.find({
      where: { status },
      relations: ["pomodoros"],
      select: ["id", "title", "description", "status", "priority", "estimatedPomodoros", "completedPomodoros", "createdAt", "updatedAt"],
      order: { createdAt: "DESC" },
    });
  }
  async create(taskData: Partial<Task>): Promise<Task> {
    const task = this.taskRepository.create(taskData);
    const savedTask = await this.taskRepository.save(task);

    // Nota: Lumi AI independente monitora mudanças diretamente no banco

    return savedTask;
  }
  async update(id: string, taskData: Partial<Task>): Promise<Task | null> {
    const task = await this.findById(id);

    if (!task) {
      return null;
    }
    this.taskRepository.merge(task, taskData);
    const updatedTask = await this.taskRepository.save(task);

    return updatedTask;
  }  async delete(id: string): Promise<boolean> {
    // Buscar a tarefa com seus relacionamentos
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ["pomodoros", "flowers"]
    });

    if (!task) {
      return false;
    }

    // Usar transaction para garantir consistência
    return await this.taskRepository.manager.transaction(async (manager) => {
      // Deletar pomodoros relacionados primeiro
      if (task.pomodoros && task.pomodoros.length > 0) {
        await manager.delete("Pomodoro", { task: { id } });
      }

      // Deletar flores relacionadas
      if (task.flowers && task.flowers.length > 0) {
        await manager.delete("Flower", { task: { id } });
      }

      // Por fim, deletar a tarefa
      const result = await manager.delete("Task", id);
      return result.affected != null && result.affected > 0;
    });
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task | null> {
    const task = await this.findById(id);

    if (!task) {
      return null;
    }

    task.status = status;

    if (status === TaskStatus.COMPLETED) {
      task.completedAt = new Date();
    } else if (task.completedAt) {
      task.completedAt = null;
    }

    return this.taskRepository.save(task);
  }  async markAsCompleted(id: string): Promise<Task | null> {
    const task = await this.findById(id);

    if (!task) {
      return null;
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    const completedTask = await this.taskRepository.save(task);    if (completedTask.user) {
      const userId = typeof completedTask.user === 'string' ? completedTask.user : completedTask.user.id;
      
      await this.streakService.updateStreak(userId);
      await this.analyticsService.updateDailyPerformance(userId, new Date());
      await this.updateTaskGoals(userId);
      
      // Registrar analytics de produtividade
      const completionTime = completedTask.completedAt ? 
        (completedTask.completedAt.getTime() - completedTask.createdAt.getTime()) / 1000 : 0;
      await this.productivityAnalyticsService.recordTaskCompletion(userId, id, completionTime);
    }

    return completedTask;
  }
  async markAsIncomplete(id: string): Promise<Task | null> {
    const task = await this.findById(id);

    if (!task) {
      return null;
    }

    task.status = TaskStatus.PENDING;
    task.completedAt = null;
    const incompleteTask = await this.taskRepository.save(task);

    return incompleteTask;
  }

  async updateCompletedPomodoros(
    id: string,
    completedPomodoros: number
  ): Promise<Task | null> {
    const task = await this.findById(id);

    if (!task) {
      return null;
    }

    task.completedPomodoros = completedPomodoros;
    return this.taskRepository.save(task);
  }

  private async updateTaskGoals(userId: string): Promise<void> {
    try {
      const activeGoals = await this.goalService.getUserGoals(userId);
      const taskGoals = activeGoals.filter(goal => goal.category === GoalCategory.TASKS_COMPLETED);

      for (const goal of taskGoals) {
        const currentValue = await this.getTasksCompletedInPeriod(userId, goal.startDate, goal.endDate);
        await this.goalService.updateGoalProgress(goal.id, currentValue);
      }
    } catch (error) {
      console.error("Erro ao atualizar metas de tarefas:", error);
    }
  }
  private async getTasksCompletedInPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    return await this.taskRepository.count({
      where: {
        user: { id: userId },
        status: TaskStatus.COMPLETED,
        completedAt: Between(startDate, endDate)
      }
    });
  }
}
