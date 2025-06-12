import { AppDataSource } from "../data-source";
import { Pomodoro, PomodoroStatus } from "../entities/Pomodoro";
import { Task } from "../entities/Task";
import { Repository } from "typeorm";
import { TaskService } from "./TaskService";
import { FlowerService } from "./FlowerService";
import { logger } from "../utils/logger";

export class PomodoroService {
  private pomodoroRepository: Repository<Pomodoro>;
  private taskService: TaskService;
  private flowerService: FlowerService;

  constructor() {
    this.pomodoroRepository = AppDataSource.getRepository(Pomodoro);
    this.taskService = new TaskService();
    this.flowerService = new FlowerService();
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
      );

      try {
        await this.flowerService.createFlowerForPomodoroCompletion(
          userId,
          pomodoro.task.id
        );
      } catch (error) {        // Log apenas erros críticos em produção
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
}