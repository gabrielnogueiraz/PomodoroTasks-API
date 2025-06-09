import { AppDataSource } from "../data-source";
import { LumiMemory, LumiMoodType } from "../entities/LumiMemory";
import { User } from "../entities/User";
import { Task } from "../entities/Task";
import { Flower } from "../entities/Flower";
import { Garden } from "../entities/Garden";
import { Repository } from "typeorm";

export interface LumiContextData {
  user: {
    id: string;
    name: string;
    email: string;
    memberSince: Date;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    completedAt?: Date;
    estimatedPomodoros: number;
    completedPomodoros: number;
  }>;
  garden: {
    totalFlowers: number;
    recentFlowers: Array<{
      color: string;
      type: string;
      earnedAt: Date;
      taskTitle: string;
    }>;
  };
  statistics: {
    totalTasksCompleted: number;
    currentStreak: number;
    averageCompletionRate: number;
    mostProductiveTimeOfDay: string;
  };
  conversationHistory: Array<{
    timestamp: Date;
    userMessage: string;
    lumiResponse: string;
    context: string;
  }>;
}

export interface LumiRequest {
  userId: string;
  message: string;
  context: LumiContextData;
  action?: "task_created" | "task_completed" | "task_deleted" | "flower_earned" | "chat";
}

export interface LumiResponse {
  response: string;
  mood: LumiMoodType;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    data: any;
  }>;
}

export interface LumiTaskAction {
  type: "create" | "update" | "delete" | "complete" | "start_pomodoro";
  taskData?: Partial<Task>;
  taskId?: string;
  pomodoroData?: { duration?: number; notes?: string };
}

export interface LumiActionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class LumiService {
  private lumiMemoryRepository: Repository<LumiMemory>;
  private userRepository: Repository<User>;
  private taskRepository: Repository<Task>;
  private flowerRepository: Repository<Flower>;
  private gardenRepository: Repository<Garden>;
  private _taskService: any;
  private _pomodoroService: any;
  constructor() {
    this.lumiMemoryRepository = AppDataSource.getRepository(LumiMemory);
    this.userRepository = AppDataSource.getRepository(User);
    this.taskRepository = AppDataSource.getRepository(Task);
    this.flowerRepository = AppDataSource.getRepository(Flower);
    this.gardenRepository = AppDataSource.getRepository(Garden);
  }

  // Lazy loading para quebrar dependência circular
  private get taskService() {
    if (!this._taskService) {
      const { TaskService } = require("./TaskService");
      this._taskService = new TaskService();
    }
    return this._taskService;
  }

  private get pomodoroService() {
    if (!this._pomodoroService) {
      const { PomodoroService } = require("./PomodoroService");
      this._pomodoroService = new PomodoroService();
    }
    return this._pomodoroService;
  }

  async getOrCreateLumiMemory(userId: string): Promise<LumiMemory> {
    let memory = await this.lumiMemoryRepository.findOne({
      where: { user: { id: userId } },
      relations: ["user"]
    });

    if (!memory) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      memory = this.lumiMemoryRepository.create({
        user,
        personalityProfile: {
          userPreferences: [],
          communicationStyle: "friendly",
          motivationTriggers: [],
          goals: [],
          challenges: []
        },
        behaviorPatterns: {
          mostProductiveHours: [],
          averageTaskDuration: 0,
          preferredTaskTypes: [],
          procrastinationTriggers: [],
          completionRate: 0
        },
        conversationHistory: [],
        achievements: {
          totalTasksCompleted: 0,
          longestStreak: 0,
          currentStreak: 0,
          favoriteFlowerColors: [],
          milestones: []
        },        contextualMemory: {
          recentTasks: [],
          recentFlowers: [],
          recentInterruptions: [],
          lastInteraction: new Date(),
          currentFocus: ""
        },
        currentMood: LumiMoodType.ENCOURAGING,
        interactionCount: 0,
        helpfulnessScore: 0
      });

      memory = await this.lumiMemoryRepository.save(memory);
    }

    return memory;
  }

  async getFullUserContext(userId: string): Promise<LumiContextData> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tasks", "flowers", "garden"]
    });

    if (!user) {
      throw new Error("User not found");
    }

    const recentTasks = await this.taskRepository.find({
      where: { user: { id: userId } },
      order: { updatedAt: "DESC" },
      take: 10
    });

    const recentFlowers = await this.flowerRepository.find({
      where: { user: { id: userId } },
      relations: ["task"],
      order: { createdAt: "DESC" },
      take: 5
    });

    const memory = await this.getOrCreateLumiMemory(userId);

    const completedTasks = recentTasks.filter(task => task.status === "completed");
    const completionRate = recentTasks.length > 0 ? 
      (completedTasks.length / recentTasks.length) * 100 : 0;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        memberSince: user.createdAt
      },
      recentTasks: recentTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        completedAt: task.completedAt,
        estimatedPomodoros: task.estimatedPomodoros,
        completedPomodoros: task.completedPomodoros
      })),
      garden: {
        totalFlowers: user.garden?.totalFlowers || 0,
        recentFlowers: recentFlowers.map(flower => ({
          color: flower.color,
          type: flower.type,
          earnedAt: flower.createdAt,
          taskTitle: flower.earnedFromTaskTitle
        }))
      },
      statistics: {
        totalTasksCompleted: completedTasks.length,
        currentStreak: memory.achievements.currentStreak,
        averageCompletionRate: completionRate,
        mostProductiveTimeOfDay: this.calculateMostProductiveTime(recentTasks)
      },
      conversationHistory: memory.conversationHistory.slice(-5)
    };
  }

  async updateLumiMemory(
    userId: string, 
    conversationEntry?: {
      userMessage: string;
      lumiResponse: string;
      context: string;
      mood: LumiMoodType;
    },
    behaviorUpdate?: Partial<LumiMemory['behaviorPatterns']>,
    achievementUpdate?: Partial<LumiMemory['achievements']>
  ): Promise<LumiMemory> {
    const memory = await this.getOrCreateLumiMemory(userId);

    if (conversationEntry) {
      memory.conversationHistory.push({
        timestamp: new Date(),
        ...conversationEntry
      });

      // Manter apenas as últimas 50 conversas
      if (memory.conversationHistory.length > 50) {
        memory.conversationHistory = memory.conversationHistory.slice(-50);
      }
    }

    if (behaviorUpdate) {
      memory.behaviorPatterns = { ...memory.behaviorPatterns, ...behaviorUpdate };
    }

    if (achievementUpdate) {
      memory.achievements = { ...memory.achievements, ...achievementUpdate };
    }

    memory.interactionCount += 1;
    memory.contextualMemory.lastInteraction = new Date();

    return this.lumiMemoryRepository.save(memory);
  }

  async recordTaskAction(userId: string, action: string, task: Task): Promise<void> {
    const memory = await this.getOrCreateLumiMemory(userId);
    
    // Atualizar memória contextual
    const taskEntry = {
      id: task.id,
      title: task.title,
      status: task.status,
      completedAt: task.completedAt,
      lumiNotes: `Task ${action} at ${new Date().toISOString()}`
    };

    memory.contextualMemory.recentTasks.unshift(taskEntry);
    
    // Manter apenas as últimas 20 tarefas
    if (memory.contextualMemory.recentTasks.length > 20) {
      memory.contextualMemory.recentTasks = memory.contextualMemory.recentTasks.slice(0, 20);
    }

    // Atualizar estatísticas se tarefa foi completada
    if (action === "completed") {
      memory.achievements.totalTasksCompleted += 1;
      this.updateStreak(memory);
    }

    await this.lumiMemoryRepository.save(memory);

    // Notificar Lumi sobre a ação
    const context = await this.getFullUserContext(userId);
    await this.sendToLumiAI({
      userId,
      message: `User ${action} task: ${task.title}`,
      context,
      action: `task_${action}` as any
    });
  }

  async recordPomodoroCompleted(userId: string, taskTitle: string): Promise<void> {
    const memory = await this.getOrCreateLumiMemory(userId);
    
    // Atualizar padrões comportamentais
    const currentHour = new Date().getHours();
    if (!memory.behaviorPatterns.mostProductiveHours.includes(currentHour.toString())) {
      memory.behaviorPatterns.mostProductiveHours.push(currentHour.toString());
    }

    await this.lumiMemoryRepository.save(memory);
  }
  async recordPomodoroInterrupted(userId: string, taskTitle: string, reason?: string): Promise<void> {
    const memory = await this.getOrCreateLumiMemory(userId);
    
    // Registrar padrão de interrupção
    const interruptionEntry = {
      taskTitle,
      timestamp: new Date(),
      reason: reason || "Não especificado",
      hour: new Date().getHours()
    };

    // Garantir que o array existe
    if (!memory.contextualMemory.recentInterruptions) {
      memory.contextualMemory.recentInterruptions = [];
    }
    
    memory.contextualMemory.recentInterruptions.unshift(interruptionEntry);
    
    // Manter apenas as últimas 10 interrupções
    if (memory.contextualMemory.recentInterruptions.length > 10) {
      memory.contextualMemory.recentInterruptions = memory.contextualMemory.recentInterruptions.slice(0, 10);
    }

    await this.lumiMemoryRepository.save(memory);

    // Notificar Lumi sobre a interrupção
    const context = await this.getFullUserContext(userId);
    await this.sendToLumiAI({
      userId,
      message: `User interrupted pomodoro for task: ${taskTitle}. Reason: ${reason || "not specified"}`,
      context,
      action: "task_interrupted" as any
    });
  }

  async recordFlowerEarned(userId: string, flowerData: any): Promise<void> {
    const memory = await this.getOrCreateLumiMemory(userId);
    
    const flowerEntry = {
      id: flowerData.id,
      color: flowerData.color,
      type: flowerData.type,
      earnedAt: new Date(),
      lumiComment: `Beautiful ${flowerData.color} flower earned from completing a task!`
    };

    memory.contextualMemory.recentFlowers.unshift(flowerEntry);
    
    // Manter apenas as últimas 10 flores
    if (memory.contextualMemory.recentFlowers.length > 10) {
      memory.contextualMemory.recentFlowers = memory.contextualMemory.recentFlowers.slice(0, 10);
    }

    // Atualizar cores favoritas
    if (!memory.achievements.favoriteFlowerColors.includes(flowerData.color)) {
      memory.achievements.favoriteFlowerColors.push(flowerData.color);
    }

    await this.lumiMemoryRepository.save(memory);

    // Notificar Lumi sobre a flor
    const context = await this.getFullUserContext(userId);
    await this.sendToLumiAI({
      userId,
      message: `User earned a ${flowerData.color} ${flowerData.type} flower!`,
      context,
      action: "flower_earned"
    });
  }  async sendToLumiAI(request: LumiRequest): Promise<LumiResponse> {
    try {
      const lumiAIUrl = process.env.LUMI_AI_URL || 'http://localhost:5000/api/chat';
      
      // 🔥 CONTEXTO ENXUTO - Evitar vazamento de memória
      const fullContext = await this.getFullUserContext(request.userId);
      const userMemory = await this.getOrCreateLumiMemory(request.userId);
      
      // 🎯 CONTEXTO OTIMIZADO - Apenas dados essenciais
      const safeContext = {
        user: {
          id: fullContext.user.id,
          name: fullContext.user.name,
          memberSince: fullContext.user.memberSince
        },
        recentTasks: fullContext.recentTasks.slice(0, 5), // Apenas 5 tarefas mais recentes
        garden: {
          totalFlowers: fullContext.garden.totalFlowers,
          recentFlowers: fullContext.garden.recentFlowers.slice(0, 3) // Apenas 3 flores
        },
        statistics: fullContext.statistics,
        achievements: {
          totalTasksCompleted: userMemory.achievements.totalTasksCompleted,
          currentStreak: userMemory.achievements.currentStreak,
          longestStreak: userMemory.achievements.longestStreak
        },
        currentMood: userMemory.currentMood,
        interactionCount: userMemory.interactionCount,
        lastInteraction: userMemory.contextualMemory.lastInteraction
      };

      const requestBody = {
        userId: request.userId,
        message: request.message,
        action: request.action,
        context: safeContext
      };

      console.log('🚀 Enviando para Lumi AI:', {
        url: lumiAIUrl,
        userId: request.userId,
        message: request.message,
        contextSize: JSON.stringify(safeContext).length
      });      const response = await fetch(lumiAIUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lumi AI responded with status: ${response.status} - ${errorText}`);
      }

      const lumiResponse: LumiResponse = await response.json();

      // Salvar a conversa na memória (contexto simplificado)
      await this.updateLumiMemory(request.userId, {
        userMessage: request.message,
        lumiResponse: lumiResponse.response,
        context: `User: ${fullContext.user.name}, Tasks: ${fullContext.recentTasks.length}`,
        mood: lumiResponse.mood
      });

      return lumiResponse;
    } catch (error) {
      console.error('❌ Erro ao comunicar com Lumi AI:', error);
      
      // Resposta de fallback inteligente
      const fallbackContext = await this.getFullUserContext(request.userId);
      const fallbackResponse = this.generateIntelligentFallback(request.message, fallbackContext);
      return fallbackResponse;
    }
  }

  private calculateMostProductiveTime(tasks: Task[]): string {
    const completedTasks = tasks.filter(task => task.status === "completed" && task.completedAt);
    
    if (completedTasks.length === 0) {
      return "Dados insuficientes";
    }

    const hourCounts: { [hour: string]: number } = {};
    
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const hour = task.completedAt.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const mostProductiveHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b
    );

    return `${mostProductiveHour}:00`;
  }

  private updateStreak(memory: LumiMemory): void {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Lógica simplificada de streak - pode ser melhorada
    memory.achievements.currentStreak += 1;
    
    if (memory.achievements.currentStreak > memory.achievements.longestStreak) {
      memory.achievements.longestStreak = memory.achievements.currentStreak;
    }
  }

  async deleteLumiMemory(userId: string): Promise<void> {
    const memory = await this.lumiMemoryRepository.findOne({
      where: { user: { id: userId } }
    });
    
    if (memory) {
      await this.lumiMemoryRepository.remove(memory);
    }
  }

  // 🆕 NOVOS MÉTODOS PARA AÇÕES DA LUMI

  /**
   * Permite que a Lumi execute ações no sistema
   */
  async executeLumiAction(userId: string, action: LumiTaskAction): Promise<LumiActionResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return {
          success: false,
          message: "Usuário não encontrado",
          error: "USER_NOT_FOUND"
        };
      }

      switch (action.type) {
        case "create":
          return await this.createTaskForUser(userId, action.taskData!);
        
        case "update":
          return await this.updateTaskForUser(userId, action.taskId!, action.taskData!);
        
        case "delete":
          return await this.deleteTaskForUser(userId, action.taskId!);
        
        case "complete":
          return await this.completeTaskForUser(userId, action.taskId!);
        
        case "start_pomodoro":
          return await this.startPomodoroForUser(userId, action.taskId!, action.pomodoroData);
        
        default:
          return {
            success: false,
            message: "Ação não reconhecida",
            error: "INVALID_ACTION"
          };
      }
    } catch (error) {
      console.error("Erro ao executar ação da Lumi:", error);
      return {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      };
    }
  }

  /**
   * Cria uma tarefa para o usuário
   */
  private async createTaskForUser(userId: string, taskData: Partial<Task>): Promise<LumiActionResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      const task = await this.taskService.create({
        ...taskData,
        user: user!
      });

      // Registrar a ação na memória da Lumi
      await this.recordTaskAction(userId, "created_by_lumi", task);

      return {
        success: true,
        message: `Tarefa "${task.title}" criada com sucesso!`,
        data: {
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          estimatedPomodoros: task.estimatedPomodoros
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Não foi possível criar a tarefa",
        error: error instanceof Error ? error.message : "CREATE_TASK_ERROR"
      };
    }
  }

  /**
   * Atualiza uma tarefa do usuário
   */
  private async updateTaskForUser(userId: string, taskId: string, taskData: Partial<Task>): Promise<LumiActionResponse> {
    try {
      // Verificar se a tarefa pertence ao usuário
      const existingTask = await this.taskRepository.findOne({
        where: { id: taskId, user: { id: userId } },
        relations: ["user"]
      });

      if (!existingTask) {
        return {
          success: false,
          message: "Tarefa não encontrada ou não pertence ao usuário",
          error: "TASK_NOT_FOUND"
        };
      }

      const updatedTask = await this.taskService.update(taskId, taskData);

      if (!updatedTask) {
        return {
          success: false,
          message: "Não foi possível atualizar a tarefa",
          error: "UPDATE_FAILED"
        };
      }

      // Registrar a ação na memória da Lumi
      await this.recordTaskAction(userId, "updated_by_lumi", updatedTask);

      return {
        success: true,
        message: `Tarefa "${updatedTask.title}" atualizada com sucesso!`,
        data: {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          status: updatedTask.status,
          dueDate: updatedTask.dueDate
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao atualizar a tarefa",
        error: error instanceof Error ? error.message : "UPDATE_TASK_ERROR"
      };
    }
  }

  /**
   * Deleta uma tarefa do usuário
   */
  private async deleteTaskForUser(userId: string, taskId: string): Promise<LumiActionResponse> {
    try {
      // Verificar se a tarefa pertence ao usuário
      const existingTask = await this.taskRepository.findOne({
        where: { id: taskId, user: { id: userId } },
        relations: ["user"]
      });

      if (!existingTask) {
        return {
          success: false,
          message: "Tarefa não encontrada ou não pertence ao usuário",
          error: "TASK_NOT_FOUND"
        };
      }

      const taskTitle = existingTask.title;
      const deleted = await this.taskService.delete(taskId);

      if (!deleted) {
        return {
          success: false,
          message: "Não foi possível deletar a tarefa",
          error: "DELETE_FAILED"
        };
      }

      // Registrar a ação na memória da Lumi
      await this.recordTaskAction(userId, "deleted_by_lumi", existingTask);

      return {
        success: true,
        message: `Tarefa "${taskTitle}" removida com sucesso!`,
        data: { deletedTaskId: taskId }
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao deletar a tarefa",
        error: error instanceof Error ? error.message : "DELETE_TASK_ERROR"
      };
    }
  }

  /**
   * Marca uma tarefa como concluída
   */
  private async completeTaskForUser(userId: string, taskId: string): Promise<LumiActionResponse> {
    try {
      // Verificar se a tarefa pertence ao usuário
      const existingTask = await this.taskRepository.findOne({
        where: { id: taskId, user: { id: userId } },
        relations: ["user"]
      });

      if (!existingTask) {
        return {
          success: false,
          message: "Tarefa não encontrada ou não pertence ao usuário",
          error: "TASK_NOT_FOUND"
        };
      }

      const completedTask = await this.taskService.markAsCompleted(taskId);

      if (!completedTask) {
        return {
          success: false,
          message: "Não foi possível marcar a tarefa como concluída",
          error: "COMPLETE_FAILED"
        };
      }

      return {
        success: true,
        message: `Parabéns! Tarefa "${completedTask.title}" marcada como concluída! 🎉`,
        data: {
          id: completedTask.id,
          title: completedTask.title,
          status: completedTask.status,
          completedAt: completedTask.completedAt
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao marcar tarefa como concluída",
        error: error instanceof Error ? error.message : "COMPLETE_TASK_ERROR"
      };
    }
  }

  /**
   * Inicia um pomodoro para uma tarefa
   */
  private async startPomodoroForUser(userId: string, taskId: string, pomodoroData?: { duration?: number; notes?: string }): Promise<LumiActionResponse> {
    try {
      // Verificar se a tarefa pertence ao usuário
      const existingTask = await this.taskRepository.findOne({
        where: { id: taskId, user: { id: userId } },
        relations: ["user"]
      });

      if (!existingTask) {
        return {
          success: false,
          message: "Tarefa não encontrada ou não pertence ao usuário",
          error: "TASK_NOT_FOUND"
        };
      }

      // Criar o pomodoro
      const pomodoro = await this.pomodoroService.create({
        taskId: taskId,
        duration: pomodoroData?.duration || 25 * 60, // 25 minutos por padrão
        notes: pomodoroData?.notes
      });

      if (!pomodoro) {
        return {
          success: false,
          message: "Não foi possível criar o pomodoro",
          error: "CREATE_POMODORO_FAILED"
        };
      }

      // Iniciar o pomodoro
      const startedPomodoro = await this.pomodoroService.start(pomodoro.id);

      if (!startedPomodoro) {
        return {
          success: false,
          message: "Não foi possível iniciar o pomodoro",
          error: "START_POMODORO_FAILED"
        };
      }

      return {
        success: true,
        message: `Pomodoro iniciado para a tarefa "${existingTask.title}"! Foco total por ${Math.round((pomodoroData?.duration || 25 * 60) / 60)} minutos! 🍅`,
        data: {
          pomodoroId: startedPomodoro.id,
          taskTitle: existingTask.title,
          duration: startedPomodoro.duration,
          startTime: startedPomodoro.startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao iniciar pomodoro",
        error: error instanceof Error ? error.message : "START_POMODORO_ERROR"
      };
    }
  }
  /**
   * Gera uma resposta de fallback inteligente quando a Lumi IA não está disponível
   */
  private generateIntelligentFallback(message: string, context: LumiContextData): LumiResponse {
    const userName = context.user.name || "amigo";
    const messageLower = message.toLowerCase();
    
    // Detectar intenções comuns
    if (messageLower.includes("criar") && messageLower.includes("tarefa")) {
      return {
        response: `Oi ${userName}! 😊 Entendi que você quer criar uma tarefa. Você pode usar o botão "Nova Tarefa" no seu painel. Estou aqui para te apoiar!`,
        mood: LumiMoodType.ENCOURAGING,
        suggestions: ["Usar o botão Nova Tarefa", "Me fale mais sobre a tarefa"]
      };
    }
    
    if (messageLower.includes("pomodoro")) {
      return {
        response: `${userName}, que bom te ver! 🍅 Para iniciar um pomodoro, selecione uma tarefa e clique em "Iniciar Pomodoro". Vou estar aqui torcendo por você!`,
        mood: LumiMoodType.MOTIVATIONAL,
        suggestions: ["Escolher uma tarefa", "Configurar timer"]
      };
    }    if (messageLower.includes("jardim") || messageLower.includes("flor")) {
      const totalFlowers = context.garden.totalFlowers;
      return {
        response: `Seu jardim está lindo, ${userName}! 🌸 Você já tem ${totalFlowers} flores. Cada tarefa completada faz uma nova flor crescer!`,
        mood: LumiMoodType.CELEBRATORY,
        suggestions: ["Ver jardim completo", "Completar mais tarefas"]
      };
    }

    if (messageLower.includes("olá") || messageLower.includes("oi") || messageLower.includes("hello")) {
      const taskCount = context.recentTasks.length;
      const completedToday = context.recentTasks.filter(task => 
        task.status === "completed" && 
        task.completedAt && 
        new Date(task.completedAt).toDateString() === new Date().toDateString()
      ).length;

      return {
        response: `Olá, ${userName}! 😊 Fico feliz em te ver! ${taskCount > 0 ? 
          `Você tem ${taskCount} tarefas no seu painel.` : 
          'Que tal começarmos criando uma nova tarefa?'} ${completedToday > 0 ? 
          `Parabéns por já ter completado ${completedToday} tarefa${completedToday > 1 ? 's' : ''} hoje! 🎉` : 
          'Está pronto para ser produtivo hoje?'}`,
        mood: LumiMoodType.ENCOURAGING,
        suggestions: [
          "Criar uma nova tarefa",
          "Ver minhas tarefas",
          "Iniciar um pomodoro",
          "Como está minha produtividade?"
        ]
      };
    }
    
    // Resposta geral amigável
    return {
      response: `Oi ${userName}! 😊 Estou aqui para te ajudar com suas tarefas e produtividade. O que você gostaria de fazer hoje?`,
      mood: LumiMoodType.ENCOURAGING,
      suggestions: [
        "Criar uma nova tarefa",
        "Iniciar um pomodoro", 
        "Ver meu progresso",
        "Explorar meu jardim"
      ]
    };
  }
}
