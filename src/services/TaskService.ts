import { AppDataSource } from "../data-source";
import { Task, TaskPriority, TaskStatus } from "../entities/Task";
import { Repository, Between } from "typeorm";
import { StreakService } from "./StreakService";
import { AnalyticsService } from "./AnalyticsService";
import { GoalService } from "./GoalService";
import { ProductivityAnalyticsService } from "./ProductivityAnalyticsService";
import { GoalCategory } from "../entities/Goal";
import { KanbanBoard } from "../entities/KanbanBoard";
import { KanbanColumn } from "../entities/KanbanColumn";
import { Goal } from "../entities/Goal";

export class TaskService {
  private taskRepository: Repository<Task>;
  private streakService: StreakService;
  private analyticsService: AnalyticsService;
  private goalService: GoalService;
  private productivityAnalyticsService: ProductivityAnalyticsService;
  private kanbanBoardRepository: Repository<KanbanBoard>;
  private kanbanColumnRepository: Repository<KanbanColumn>;
  private goalRepository: Repository<Goal>;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
    this.kanbanBoardRepository = AppDataSource.getRepository(KanbanBoard);
    this.kanbanColumnRepository = AppDataSource.getRepository(KanbanColumn);
    this.goalRepository = AppDataSource.getRepository(Goal);
    this.streakService = new StreakService();
    this.analyticsService = new AnalyticsService();
    this.goalService = new GoalService();
    this.productivityAnalyticsService = new ProductivityAnalyticsService();
  }  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      relations: ["pomodoros", "kanbanBoard", "goal", "kanbanColumn"],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        estimatedPomodoros: true,
        completedPomodoros: true,
        createdAt: true,
        updatedAt: true,
        kanbanBoard: { id: true },
        goal: { id: true },
        kanbanColumn: { id: true }
      },
      order: { createdAt: "DESC" },
    });
  }
  async findById(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({
      where: { id },
      relations: ["pomodoros", "kanbanBoard", "goal", "kanbanColumn"],
    });
  }
  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.taskRepository.find({
      where: { status },
      relations: ["pomodoros", "kanbanBoard", "goal", "kanbanColumn"],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        estimatedPomodoros: true,
        completedPomodoros: true,
        createdAt: true,
        updatedAt: true,
        kanbanBoard: { id: true },
        goal: { id: true },
        kanbanColumn: { id: true }
      },
      order: { createdAt: "DESC" },
    });
  }  async findByBoardId(boardId: string, userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { 
        kanbanBoard: { id: boardId },
        user: { id: userId }
      },
      relations: ["pomodoros", "kanbanBoard", "goal", "kanbanColumn"],
      order: { createdAt: "DESC" },
    });
  }

  async findByGoalId(goalId: string, userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { 
        goal: { id: goalId },
        user: { id: userId }
      },
      relations: ["pomodoros", "kanbanBoard", "goal", "kanbanColumn"],
      order: { createdAt: "DESC" },
    });
  }

  async findByColumnId(columnId: string, userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { 
        kanbanColumn: { id: columnId },
        user: { id: userId }
      },
      relations: ["pomodoros", "kanbanBoard", "goal", "kanbanColumn"],
      order: { position: "ASC", createdAt: "DESC" },
    });
  }

  async create(taskData: any): Promise<Task> {
    // Validar se tanto boardId quanto goalId foram fornecidos
    if (taskData.boardId && taskData.goalId) {
      throw new Error('Tarefa não pode pertencer a quadro independente E meta simultaneamente');
    }

    // Validar se o quadro ou meta existe e pertence ao usuário
    if (taskData.boardId) {
      const board = await this.kanbanBoardRepository.findOne({
        where: { id: taskData.boardId, user: { id: taskData.user.id } }
      });
      if (!board) {
        throw new Error('Quadro não encontrado ou não pertence ao usuário');
      }
      taskData.kanbanBoard = { id: taskData.boardId };
    }

    if (taskData.goalId) {
      const goal = await this.goalRepository.findOne({
        where: { id: taskData.goalId, user: { id: taskData.user.id } }
      });
      if (!goal) {
        throw new Error('Meta não encontrada ou não pertence ao usuário');
      }
      taskData.goal = { id: taskData.goalId };
    }

    // Validar se a coluna pertence ao quadro correto
    if (taskData.columnId) {
      let columnValid = false;
      
      if (taskData.boardId) {
        const column = await this.kanbanColumnRepository.findOne({
          where: { id: taskData.columnId, board: { id: taskData.boardId } }
        });
        columnValid = !!column;
      } else if (taskData.goalId) {
        const column = await this.kanbanColumnRepository.findOne({
          where: { 
            id: taskData.columnId, 
            board: { goal: { id: taskData.goalId } } 
          },
          relations: ["board", "board.goal"]
        });
        columnValid = !!column;
      }

      if (!columnValid) {
        throw new Error('Coluna não pertence ao quadro especificado');
      }
      
      taskData.kanbanColumn = { id: taskData.columnId };
    }    // Remover campos temporários antes de criar a tarefa
    const { boardId, goalId, columnId, ...cleanTaskData } = taskData;

    try {
      const task = this.taskRepository.create(cleanTaskData);
      const savedTask = await this.taskRepository.save(task);
      
      // TypeORM save retorna Task quando salva uma única entidade
      const savedId = (savedTask as any).id;

      // Buscar a tarefa completa com todas as relações
      const completeTask = await this.taskRepository.findOne({
        where: { id: savedId },
        relations: ["pomodoros", "kanbanBoard", "goal", "kanbanColumn"],
      });
      
      return completeTask!;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      throw error;
    }
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
