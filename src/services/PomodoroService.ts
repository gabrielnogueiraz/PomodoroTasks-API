import { AppDataSource } from "../data-source";
import { Pomodoro, PomodoroStatus } from "../entities/Pomodoro";
import { Task } from "../entities/Task";
import { Repository } from "typeorm";
import { TaskService } from "./TaskService";
import { FlowerService } from "./FlowerService";

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
  }  async complete(id: string, userId: string): Promise<Pomodoro | null> {
    console.log(`Iniciando conclusão do pomodoro ${id} para usuário ${userId}`);
    
    // Buscamos o pomodoro apenas com a relação da tarefa
    const pomodoro = await this.pomodoroRepository.findOne({
      where: { id },
      relations: ["task"]
    });
    
    if (!pomodoro) {
      console.log(`Pomodoro ${id} não encontrado`);
      return null;
    }
    
    // Verificar se o pomodoro já está completo para evitar duplicação
    if (pomodoro.status === PomodoroStatus.COMPLETED) {
      console.log(`Pomodoro ${id} já está completo, não criando flor duplicada`);
      return pomodoro;
    }

    if (pomodoro.status !== PomodoroStatus.IN_PROGRESS) {
      console.log(`Pomodoro ${id} não está em progresso (status: ${pomodoro.status})`);
      throw new Error('Pomodoro não está em progresso');
    }
    
    console.log(`Marcando pomodoro ${id} como completo`);
    pomodoro.endTime = new Date();
    pomodoro.status = PomodoroStatus.COMPLETED;
    
    const savedPomodoro = await this.pomodoroRepository.save(pomodoro);
    console.log(`Pomodoro ${id} salvo como completo`);
    
    if (pomodoro.task) {
      console.log(`Atualizando contador de pomodoros completados para tarefa ${pomodoro.task.id}`);
      await this.taskService.updateCompletedPomodoros(
        pomodoro.task.id, 
        (pomodoro.task.completedPomodoros || 0) + 1
      );

      try {
        console.log(`Criando flor para pomodoro completado - Usuário: ${userId}, Tarefa: ${pomodoro.task.id}`);
        const flower = await this.flowerService.createFlowerForPomodoroCompletion(
          userId,
          pomodoro.task.id
        );
        
        if (flower) {
          console.log(`✅ Flor criada com sucesso: ${flower.id} (${flower.color} ${flower.type})`);
        } else {
          console.log(`❌ Não foi possível criar a flor`);
        }
      } catch (error) {
        console.error('❌ Erro ao criar flor para pomodoro:', error);
        // Não rejeitamos a Promise aqui, apenas logamos o erro
        // O pomodoro foi completado com sucesso, mesmo se a flor falhou
      }
    } else {
      console.log(`⚠️ Pomodoro ${id} não tem tarefa associada`);
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