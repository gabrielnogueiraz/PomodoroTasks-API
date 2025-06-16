import { AppDataSource } from "../data-source";
import { Pomodoro, PomodoroStatus } from "../entities/Pomodoro";
import { Task } from "../entities/Task";
import { Repository, Between } from "typeorm";
import { TaskService } from "./TaskService";
import { FlowerService } from "./FlowerService";
import { AnalyticsService } from "./AnalyticsService";
import { GoalService } from "./GoalService";
import { GoalCategory } from "../entities/Goal";
import { logger } from "../utils/logger";

export class PomodoroService {
  private pomodoroRepository: Repository<Pomodoro>;
  private taskService: TaskService;
  private flowerService: FlowerService;
  private analyticsService: AnalyticsService;
  private goalService: GoalService;

  constructor() {
    this.pomodoroRepository = AppDataSource.getRepository(Pomodoro);
    this.taskService = new TaskService();
    this.flowerService = new FlowerService();
    this.analyticsService = new AnalyticsService();
    this.goalService = new GoalService();
  }

  async findAll(): Promise<Pomodoro[]> {
    return this.pomodoroRepository.find({
      relations: ["task"],
      order: { createdAt: "DESC" }
    });
  }

  async findById(id: string): Promise<Pomodoro | null> {
    return this.pomodoroRepository.findOne({
      where: { id },
      relations: ["task"]
    });
  }

  async findByTaskId(taskId: string): Promise<Pomodoro[]> {
    return this.pomodoroRepository.find({
      where: { task: { id: taskId } },
      relations: ["task"],
      order: { createdAt: "DESC" }
    });
  }

  async create(pomodoroData: { taskId: string, duration?: number, notes?: string }): Promise<Pomodoro | null> {
    const task = await this.taskService.findById(pomodoroData.taskId);
    
    if (!task) {
      return null;
    }
    
    const pomodoro = this.pomodoroRepository.create({
      task,
      duration: pomodoroData.duration || 25 * 60, 
      notes: pomodoroData.notes,
      status: PomodoroStatus.IN_PROGRESS
    });
    
    return this.pomodoroRepository.save(pomodoro);
  }

  async start(id: string): Promise<Pomodoro | null> {
    const pomodoro = await this.findById(id);
    
    if (!pomodoro) {
      return null;
    }
    
    pomodoro.startTime = new Date();
    pomodoro.status = PomodoroStatus.IN_PROGRESS;
    
    return this.pomodoroRepository.save(pomodoro);
  }  async complete(id: string, userId: string): Promise<Pomodoro | null> {
    const pomodoro = await this.pomodoroRepository.findOne({
      where: { id },
      relations: ["task"]
    });
    
    if (!pomodoro) {
      return null;
    }
    
    if (pomodoro.status === PomodoroStatus.COMPLETED) {
      return pomodoro;
    }

    if (pomodoro.status !== PomodoroStatus.IN_PROGRESS) {
      throw new Error('Pomodoro não está em progresso');
    }
    
    pomodoro.endTime = new Date();
    pomodoro.status = PomodoroStatus.COMPLETED;
    
    const savedPomodoro = await this.pomodoroRepository.save(pomodoro);
    
    if (pomodoro.task) {
      await this.taskService.updateCompletedPomodoros(
        pomodoro.task.id, 
        (pomodoro.task.completedPomodoros || 0) + 1
      );      try {
        await this.flowerService.createFlowerForPomodoroCompletion(
          userId,
          pomodoro.task.id
        );

        await this.analyticsService.updateDailyPerformance(userId, new Date());
        await this.updatePomodoroGoals(userId);
      } catch (error) {// Log apenas erros críticos em produção
        if (process.env.NODE_ENV === 'production') {
          logger.error(`Erro ao criar flor para pomodoro ${id}:`, error);
        } else {
          logger.error('❌ Erro ao criar flor para pomodoro:', error);
        }
      }
    }
    
    return savedPomodoro;
  }
  async interrupt(id: string, userId: string, notes?: string): Promise<Pomodoro | null> {
    const pomodoro = await this.pomodoroRepository.findOne({
      where: { id },
      relations: ["task"]
    });
    
    if (!pomodoro) {
      return null;
    }
    
    pomodoro.endTime = new Date();
    pomodoro.status = PomodoroStatus.INTERRUPTED;
    
    if (notes) {
      pomodoro.notes = pomodoro.notes 
        ? `${pomodoro.notes}\n${notes}` 
        : notes;
    }    const savedPomodoro = await this.pomodoroRepository.save(pomodoro);
    
    return savedPomodoro;
  }

  async addNotes(id: string, notes: string): Promise<Pomodoro | null> {
    const pomodoro = await this.findById(id);
    
    if (!pomodoro) {
      return null;
    }
    
    pomodoro.notes = pomodoro.notes 
      ? `${pomodoro.notes}\n${notes}` 
      : notes;
    
    return this.pomodoroRepository.save(pomodoro);
  }

  private async updatePomodoroGoals(userId: string): Promise<void> {
    try {
      const activeGoals = await this.goalService.getUserGoals(userId);
      const pomodoroGoals = activeGoals.filter(goal => 
        goal.category === GoalCategory.POMODOROS_COMPLETED || 
        goal.category === GoalCategory.FOCUS_TIME
      );

      for (const goal of pomodoroGoals) {
        let currentValue = 0;
        
        if (goal.category === GoalCategory.POMODOROS_COMPLETED) {
          currentValue = await this.getPomodorosCompletedInPeriod(userId, goal.startDate, goal.endDate);
        } else if (goal.category === GoalCategory.FOCUS_TIME) {
          currentValue = await this.getFocusTimeInPeriod(userId, goal.startDate, goal.endDate);
        }
        
        await this.goalService.updateGoalProgress(goal.id, currentValue);
      }
    } catch (error) {
      console.error("Erro ao atualizar metas de pomodoro:", error);
    }
  }
  private async getPomodorosCompletedInPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    return await this.pomodoroRepository.count({
      where: {
        task: { user: { id: userId } },
        status: PomodoroStatus.COMPLETED,
        endTime: Between(startDate, endDate)
      }
    });
  }

  private async getFocusTimeInPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const pomodoros = await this.pomodoroRepository.find({
      where: {
        task: { user: { id: userId } },
        status: PomodoroStatus.COMPLETED,
        endTime: Between(startDate, endDate)
      }
    });

    return pomodoros.reduce((total, pomodoro) => total + (pomodoro.duration / 60), 0);
  }
}