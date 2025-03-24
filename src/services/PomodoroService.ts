import { AppDataSource } from "../data-source";
import { Pomodoro, PomodoroStatus } from "../entities/Pomodoro";
import { Task } from "../entities/Task";
import { Repository } from "typeorm";
import { TaskService } from "./TaskService";

export class PomodoroService {
  private pomodoroRepository: Repository<Pomodoro>;
  private taskService: TaskService;

  constructor() {
    this.pomodoroRepository = AppDataSource.getRepository(Pomodoro);
    this.taskService = new TaskService();
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
      duration: pomodoroData.duration || 25 * 60, // Default: 25 minutes
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
  }

  async complete(id: string): Promise<Pomodoro | null> {
    const pomodoro = await this.findById(id);
    
    if (!pomodoro || !pomodoro.task) {
      return null;
    }
    
    pomodoro.endTime = new Date();
    pomodoro.status = PomodoroStatus.COMPLETED;
    
    const savedPomodoro = await this.pomodoroRepository.save(pomodoro);
    
    // Update completed pomodoros count in the task
    if (pomodoro.task) {
      await this.taskService.updateCompletedPomodoros(
        pomodoro.task.id, 
        (pomodoro.task.completedPomodoros || 0) + 1
      );
    }
    
    return savedPomodoro;
  }

  async interrupt(id: string, notes?: string): Promise<Pomodoro | null> {
    const pomodoro = await this.findById(id);
    
    if (!pomodoro) {
      return null;
    }
    
    pomodoro.endTime = new Date();
    pomodoro.status = PomodoroStatus.INTERRUPTED;
    
    if (notes) {
      pomodoro.notes = pomodoro.notes 
        ? `${pomodoro.notes}\n${notes}` 
        : notes;
    }
    
    return this.pomodoroRepository.save(pomodoro);
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