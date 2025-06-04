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

export class LumiService {
  private lumiMemoryRepository: Repository<LumiMemory>;
  private userRepository: Repository<User>;
  private taskRepository: Repository<Task>;
  private flowerRepository: Repository<Flower>;
  private gardenRepository: Repository<Garden>;

  constructor() {
    this.lumiMemoryRepository = AppDataSource.getRepository(LumiMemory);
    this.userRepository = AppDataSource.getRepository(User);
    this.taskRepository = AppDataSource.getRepository(Task);
    this.flowerRepository = AppDataSource.getRepository(Flower);
    this.gardenRepository = AppDataSource.getRepository(Garden);
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
  }

  async sendToLumiAI(request: LumiRequest): Promise<LumiResponse> {
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Lumi AI responded with status: ${response.status}`);
      }

      const lumiResponse: LumiResponse = await response.json();

      // Salvar a conversa na memória
      await this.updateLumiMemory(request.userId, {
        userMessage: request.message,
        lumiResponse: lumiResponse.response,
        context: JSON.stringify(request.context),
        mood: lumiResponse.mood
      });

      return lumiResponse;
    } catch (error) {
      console.error('Error communicating with Lumi AI:', error);
      
      // Resposta de fallback
      return {
        response: "Desculpe, estou temporariamente indisponível. Tente novamente em alguns instantes.",
        mood: LumiMoodType.SUPPORTIVE,
        suggestions: ["Tente novamente mais tarde", "Verifique sua conexão"]
      };
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
}
