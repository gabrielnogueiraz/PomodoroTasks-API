import { AppDataSource } from "../data-source";
import { Task, TaskPriority, TaskStatus } from "../entities/Task";
import { Repository } from "typeorm";

export class TaskService {
  private taskRepository: Repository<Task>;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
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
    return this.taskRepository.save(task);
  }

  async update(id: string, taskData: Partial<Task>): Promise<Task | null> {
    const task = await this.findById(id);

    if (!task) {
      return null;
    }

    this.taskRepository.merge(task, taskData);
    return this.taskRepository.save(task);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.taskRepository.delete(id);
    return result.affected != null && result.affected > 0;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task | null> {
    const task = await this.findById(id);

    if (!task) {
      return null;
    }

    task.status = status;
    return this.taskRepository.save(task);
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
