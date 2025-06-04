import { AppDataSource } from "../data-source";
import { Task, TaskPriority, TaskStatus } from "../entities/Task";
import { Repository } from "typeorm";
import { LumiService } from "./LumiService";

export class TaskService {
  private taskRepository: Repository<Task>;
  private lumiService: LumiService;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
    this.lumiService = new LumiService();
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      relations: ["pomodoros"],
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
      order: { createdAt: "DESC" },
    });
  }
  async create(taskData: Partial<Task>): Promise<Task> {
    const task = this.taskRepository.create(taskData);
    const savedTask = await this.taskRepository.save(task);
    
    // Notificar Lumi sobre a criação da tarefa
    try {
      if (taskData.user?.id) {
        await this.lumiService.recordTaskAction(
          taskData.user.id, 
          "created", 
          savedTask
        );
      }
    } catch (error) {
      console.warn("Failed to notify Lumi about task creation:", error);
    }
    
    return savedTask;
  }
  async update(id: string, taskData: Partial<Task>): Promise<Task | null> {
    const task = await this.findById(id);

    if (!task) {
      return null;
    }

    this.taskRepository.merge(task, taskData);
    const updatedTask = await this.taskRepository.save(task);
    
    // Notificar Lumi sobre a atualização da tarefa
    try {
      if (task.user?.id) {
        await this.lumiService.recordTaskAction(
          task.user.id, 
          "updated", 
          updatedTask
        );
      }
    } catch (error) {
      console.warn("Failed to notify Lumi about task update:", error);
    }
    
    return updatedTask;
  }
  async delete(id: string): Promise<boolean> {
    const task = await this.findById(id);
    
    if (task) {
      // Notificar Lumi sobre a exclusão da tarefa
      try {
        if (task.user?.id) {
          await this.lumiService.recordTaskAction(
            task.user.id, 
            "deleted", 
            task
          );
        }
      } catch (error) {
        console.warn("Failed to notify Lumi about task deletion:", error);
      }
    }
    
    const result = await this.taskRepository.delete(id);
    return result.affected != null && result.affected > 0;
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
  }
  async markAsCompleted(id: string): Promise<Task | null> {
    const task = await this.findById(id);

    if (!task) {
      return null;
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();

    const completedTask = await this.taskRepository.save(task);
    
    // Notificar Lumi sobre a conclusão da tarefa
    try {
      if (task.user?.id) {
        await this.lumiService.recordTaskAction(
          task.user.id, 
          "completed", 
          completedTask
        );
      }
    } catch (error) {
      console.warn("Failed to notify Lumi about task completion:", error);
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
    
    // Notificar Lumi sobre a marcação como incompleta
    try {
      if (task.user?.id) {
        await this.lumiService.recordTaskAction(
          task.user.id, 
          "marked_incomplete", 
          incompleteTask
        );
      }
    } catch (error) {
      console.warn("Failed to notify Lumi about task marked as incomplete:", error);
    }

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
}
