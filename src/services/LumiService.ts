import { AppDataSource } from "../data-source";
import { LumiMemory, LumiMoodType } from "../entities/LumiMemory";
import { User } from "../entities/User";
import { Task } from "../entities/Task";
import { Flower } from "../entities/Flower";
import { Garden } from "../entities/Garden";
import { Repository } from "typeorm";
import { LumiContextData } from "../types/lumi.types";
import { TaskService } from "./TaskService";
import { PomodoroService } from "./PomodoroService";
import { FlowerService } from "./FlowerService";
import { GoalService } from "./GoalService";
import { AnalyticsService } from "./AnalyticsService";
import { StreakService } from "./StreakService";
import { KanbanService } from "./KanbanService";
import { ProductivityAnalyticsService } from "./ProductivityAnalyticsService";
import { logger } from "../utils/logger";

// Tipos para as ações do Lumi
interface LumiActionData {
  type: 'create' | 'update' | 'delete' | 'complete' | 'start_pomodoro';
  taskId?: string;
  taskData?: {
    title?: string;
    description?: string;
    priority?: any;
    estimatedPomodoros?: number;
  };
  pomodoroData?: {
    duration?: number;
    notes?: string;
  };
}

interface LumiActionResult {
  success: boolean;
  message: string;
  data?: any;
}

interface LumiAIRequest {
  userId: string;
  message: string;
  context: LumiContextData;
  action: string;
}

interface LumiAIResponse {
  response: string;
  mood: string;
  suggestions?: string[];
}

export class LumiService {
  private lumiMemoryRepository: Repository<LumiMemory>;
  private userRepository: Repository<User>;
  private taskRepository: Repository<Task>;
  private flowerRepository: Repository<Flower>;
  private gardenRepository: Repository<Garden>;
  private taskService: TaskService;
  private pomodoroService: PomodoroService;
  private flowerService: FlowerService;
  private goalService: GoalService;
  private analyticsService: AnalyticsService;
  private streakService: StreakService;
  private kanbanService: KanbanService;
  private productivityAnalyticsService: ProductivityAnalyticsService;

  constructor() {
    this.lumiMemoryRepository = AppDataSource.getRepository(LumiMemory);
    this.userRepository = AppDataSource.getRepository(User);
    this.taskRepository = AppDataSource.getRepository(Task);
    this.flowerRepository = AppDataSource.getRepository(Flower);
    this.gardenRepository = AppDataSource.getRepository(Garden);
    this.taskService = new TaskService();
    this.pomodoroService = new PomodoroService();
    this.flowerService = new FlowerService();
    this.goalService = new GoalService();
    this.analyticsService = new AnalyticsService();
    this.streakService = new StreakService();
    this.kanbanService = new KanbanService();
    this.productivityAnalyticsService = new ProductivityAnalyticsService();
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
        },
        contextualMemory: {
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
  }  async getFullUserContext(userId: string): Promise<LumiContextData> {
    const [user, recentTasks, recentFlowers, memory, streakStats, activeGoals, analytics, kanbanBoards, productivityInsights] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId },
        relations: ["garden"],
        select: ["id", "name", "email", "createdAt"]
      }),
      this.taskRepository.find({
        where: { user: { id: userId } },
        select: ["id", "title", "status", "priority", "completedAt", "estimatedPomodoros", "completedPomodoros", "updatedAt"],
        order: { updatedAt: "DESC" },
        take: 10
      }),
      this.flowerRepository.find({
        where: { user: { id: userId } },
        select: ["id", "color", "type", "createdAt", "earnedFromTaskTitle"],
        order: { createdAt: "DESC" },
        take: 5
      }),
      this.getOrCreateLumiMemory(userId),
      this.streakService.getStreakStats(userId),
      this.goalService.getUserGoals(userId),
      this.analyticsService.getAnalytics(userId, 7),
      this.kanbanService.getUserBoards(userId),
      this.productivityAnalyticsService.getProductivityInsights(userId, 30)
    ]);

    if (!user) {
      throw new Error("User not found");
    }

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
        currentStreak: streakStats.currentStreak,
        longestStreak: streakStats.longestStreak,
        totalActiveDays: streakStats.totalActiveDays,
        isActiveToday: streakStats.isActiveToday,
        averageCompletionRate: completionRate,
        mostProductiveTimeOfDay: this.calculateMostProductiveTime(recentTasks),
        weeklyStats: analytics.weeklyAverage,
        bestPerformanceDays: analytics.bestPerformanceDays.length,
        mostProductiveHours: analytics.mostProductiveHours.slice(0, 3)
      },      goals: {
        active: activeGoals.filter(goal => goal.status === 'active').map(goal => ({
          id: goal.id,
          title: goal.title,
          category: goal.category,
          targetValue: Number(goal.targetValue),
          currentValue: Number(goal.currentValue),
          endDate: goal.endDate
        })),
        completed: activeGoals.filter(goal => goal.status === 'completed').map(goal => ({
          id: goal.id,
          title: goal.title,
          completedAt: goal.completedAt || new Date()
        })),
        nearCompletion: activeGoals.filter(goal => 
          goal.status === 'active' && 
          (Number(goal.currentValue) / Number(goal.targetValue)) >= 0.8
        ).map(goal => ({
          id: goal.id,
          title: goal.title,
          progress: Math.round((Number(goal.currentValue) / Number(goal.targetValue)) * 100)
        }))
      },      kanbanBoards: kanbanBoards.map(board => {
        const totalTasks = board.columns?.reduce((total, col) => total + (col.tasks?.length || 0), 0) || 0;
        const completedTasks = board.columns?.reduce((total, col) => 
          total + (col.tasks?.filter(task => task.status === 'completed').length || 0), 0) || 0;
        
        return {
          id: board.id,
          name: board.name,
          description: board.description,
          goalTitle: board.goal?.title,
          isActive: board.isActive,
          columns: board.columns?.map(col => ({
            id: col.id,
            name: col.name,
            position: col.position,
            taskCount: col.tasks?.length || 0,
            tasks: col.tasks?.map(task => ({
              id: task.id,
              title: task.title,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate
            })) || []
          })) || [],
          totalTasks,
          completedTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        };
      }),
      productivityInsights: {
        currentWeekScore: Math.round(productivityInsights.averageFocusTime / 10) || 0,
        averageScore: Math.round(productivityInsights.tasksCompletionRate) || 0,
        bestPerformanceDay: this.getBestPerformanceDay(productivityInsights.mostProductiveDays),
        improvementTrend: productivityInsights.tasksCompletionRate > 75 ? 'improving' : 
                          productivityInsights.tasksCompletionRate > 50 ? 'stable' : 'declining',
        recommendations: productivityInsights.recommendations?.map(rec => ({
          type: 'productivity',
          message: rec,
          priority: 'medium'
        })) || [],
        patterns: {
          mostProductiveHours: productivityInsights.mostProductiveHours?.map(hour => ({
            hour: hour.hour || 0,
            score: Math.round(hour.productivity * 100) || 0
          })) || [],
          bestDaysOfWeek: productivityInsights.mostProductiveDays?.map(day => ({
            day: this.getDayName(day.day || 0),
            score: Math.round(day.productivity * 100) || 0
          })) || [],
          taskCompletionPatterns: {
            averageTimeToComplete: Math.round(productivityInsights.averageFocusTime) || 0,
            preferredTaskDuration: 25, // Padrão Pomodoro
            focusSessionEfficiency: Math.round(productivityInsights.tasksCompletionRate) || 0
          }
        },
        weeklyMetrics: {
          tasksCompleted: completedTasks.length,
          pomodorosCompleted: recentTasks.reduce((total, task) => total + (task.completedPomodoros || 0), 0),
          focusTimeMinutes: Math.round(productivityInsights.averageFocusTime),
          distractionCount: recentTasks.length - completedTasks.length,
          productivityScore: Math.round(productivityInsights.tasksCompletionRate)
        }
      },
      conversationHistory: memory.conversationHistory.slice(-5)
    };
  }

  async updateLumiMemory(userId: string): Promise<LumiMemory> {
    const memory = await this.getOrCreateLumiMemory(userId);
    memory.contextualMemory.lastInteraction = new Date();
    return this.lumiMemoryRepository.save(memory);
  }

  getLumiAIUrl(): string {
    return process.env.LUMI_AI_URL || "http://localhost:5000";
  }

  private calculateMostProductiveTime(tasks: Task[]): string {
    const completedTasks = tasks.filter(task => task.completedAt);
    if (completedTasks.length === 0) return "morning";

    const hourCounts = new Array(24).fill(0);
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        hourCounts[hour]++;
      }
    });

    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    
    if (maxHour >= 6 && maxHour < 12) return "morning";
    if (maxHour >= 12 && maxHour < 18) return "afternoon";
    if (maxHour >= 18 && maxHour < 22) return "evening";
    return "night";
  }

  /**
   * Executa uma ação do Lumi (criar, atualizar, deletar tarefas, etc.)
   */
  async executeLumiAction(userId: string, action: LumiActionData): Promise<LumiActionResult> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return { success: false, message: "Usuário não encontrado" };
      }

      switch (action.type) {
        case 'create':
          if (!action.taskData) {
            return { success: false, message: "Dados da tarefa são obrigatórios para criação" };
          }
          
          const newTask = await this.taskService.create({
            title: action.taskData.title!,
            description: action.taskData.description || '',
            priority: action.taskData.priority,
            estimatedPomodoros: action.taskData.estimatedPomodoros || 1,
            user
          });

          // Atualizar memória da Lumi
          await this.updateLumiMemoryWithAction(userId, 'task_created', { taskId: newTask.id });
          
          return {
            success: true,
            message: "Tarefa criada com sucesso",
            data: newTask
          };

        case 'update':
          if (!action.taskId || !action.taskData) {
            return { success: false, message: "ID da tarefa e dados são obrigatórios para atualização" };
          }

          const updatedTask = await this.taskService.update(action.taskId, action.taskData);
          
          // Atualizar memória da Lumi
          await this.updateLumiMemoryWithAction(userId, 'task_updated', { taskId: action.taskId });
          
          return {
            success: true,
            message: "Tarefa atualizada com sucesso",
            data: updatedTask
          };

        case 'complete':
          if (!action.taskId) {
            return { success: false, message: "ID da tarefa é obrigatório para conclusão" };
          }

          const completedTask = await this.taskService.markAsCompleted(action.taskId);
          
          // Atualizar memória da Lumi
          await this.updateLumiMemoryWithAction(userId, 'task_completed', { taskId: action.taskId });
          
          return {
            success: true,
            message: "Tarefa marcada como concluída",
            data: completedTask
          };

        case 'delete':
          if (!action.taskId) {
            return { success: false, message: "ID da tarefa é obrigatório para exclusão" };
          }

          await this.taskService.delete(action.taskId);
          
          // Atualizar memória da Lumi
          await this.updateLumiMemoryWithAction(userId, 'task_deleted', { taskId: action.taskId });
          
          return {
            success: true,
            message: "Tarefa excluída com sucesso",
            data: { deletedTaskId: action.taskId }
          };        case 'start_pomodoro':
          if (!action.taskId) {
            return { success: false, message: "ID da tarefa é obrigatório para iniciar pomodoro" };
          }

          const task = await this.taskService.findById(action.taskId);
          if (!task) {
            return { success: false, message: "Tarefa não encontrada" };
          }

          // Primeiro criar o pomodoro
          const newPomodoro = await this.pomodoroService.create({
            taskId: action.taskId,
            duration: action.pomodoroData?.duration || 25 * 60,
            notes: action.pomodoroData?.notes || ''
          });

          if (!newPomodoro) {
            return { success: false, message: "Erro ao criar pomodoro" };
          }

          // Depois iniciar o pomodoro
          const pomodoro = await this.pomodoroService.start(newPomodoro.id);

          // Atualizar memória da Lumi
          await this.updateLumiMemoryWithAction(userId, 'pomodoro_started', { 
            taskId: action.taskId,
            pomodoroId: pomodoro?.id 
          });
          
          return {
            success: true,
            message: "Pomodoro iniciado com sucesso",
            data: pomodoro
          };

        default:
          return { success: false, message: "Tipo de ação não reconhecido" };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao executar ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Envia uma mensagem para o backend de IA do Lumi
   */
  async sendToLumiAI(request: LumiAIRequest): Promise<LumiAIResponse> {
    try {
      const lumiUrl = this.getLumiAIUrl();
      
      // Simular resposta para desenvolvimento/teste quando o backend de IA não estiver disponível
      const fallbackResponse: LumiAIResponse = {
        response: this.generateFallbackResponse(request.message, request.action),
        mood: "encouraging",
        suggestions: this.generateFallbackSuggestions(request.context)
      };

      // Tentar conectar ao backend de IA se disponível
      try {
        const response = await fetch(`${lumiUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(5000) // 5 segundos timeout
        });

        if (response.ok) {
          const aiResponse = await response.json();
          
          // Atualizar memória com a interação
          await this.updateLumiMemoryWithAction(request.userId, 'ai_interaction', {
            message: request.message,
            response: aiResponse.response
          });
          
          return aiResponse;
        }
      } catch (networkError) {
        logger.warn('Backend de IA não disponível, usando resposta de fallback:', networkError.message);
      }

      // Atualizar memória com a interação de fallback
      await this.updateLumiMemoryWithAction(request.userId, 'ai_interaction', {
        message: request.message,
        response: fallbackResponse.response
      });

      return fallbackResponse;
    } catch (error) {
      throw new Error(`Erro na comunicação com Lumi AI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Remove a memória do Lumi para um usuário
   */
  async deleteLumiMemory(userId: string): Promise<boolean> {
    try {
      const memory = await this.lumiMemoryRepository.findOne({
        where: { user: { id: userId } }
      });

      if (memory) {
        await this.lumiMemoryRepository.remove(memory);
        return true;
      }
      
      return false; // Não havia memória para deletar
    } catch (error) {
      logger.error('Erro ao deletar memória do Lumi:', error);
      return false;
    }
  }

  /**
   * Atualiza a memória do Lumi com uma ação específica
   */
  private async updateLumiMemoryWithAction(userId: string, actionType: string, actionData: any): Promise<void> {
    try {
      const memory = await this.getOrCreateLumiMemory(userId);
      
      // Incrementar contador de interações
      memory.interactionCount += 1;
      
      // Atualizar última interação
      memory.contextualMemory.lastInteraction = new Date();
        // Adicionar à história de conversação
      memory.conversationHistory.push({
        timestamp: new Date(),
        userMessage: `Action: ${actionType}`,
        lumiResponse: this.generateActionResponse(actionType),
        context: JSON.stringify(actionData),
        mood: memory.currentMood
      });
      
      // Manter apenas os últimos 50 registros de conversação
      if (memory.conversationHistory.length > 50) {
        memory.conversationHistory = memory.conversationHistory.slice(-50);
      }
      
      // Atualizar conquistas baseado na ação
      if (actionType === 'task_completed') {
        memory.achievements.totalTasksCompleted += 1;
        memory.achievements.currentStreak += 1;
        
        if (memory.achievements.currentStreak > memory.achievements.longestStreak) {
          memory.achievements.longestStreak = memory.achievements.currentStreak;
        }
      }
      
      // Ajustar humor baseado na ação
      memory.currentMood = this.calculateMoodFromAction(actionType, memory);
      
      // Incrementar pontuação de utilidade
      memory.helpfulnessScore += this.getHelpfulnessScoreForAction(actionType);
      
      await this.lumiMemoryRepository.save(memory);
    } catch (error) {
      logger.error('Erro ao atualizar memória do Lumi:', error);
    }
  }

  /**
   * Gera uma resposta de fallback quando o backend de IA não está disponível
   */
  private generateFallbackResponse(message: string, action: string): string {
    const responses = {
      chat: [
        "Olá! Estou aqui para ajudar você a ser mais produtivo! 🌟",
        "Como posso ajudar você hoje com suas tarefas?",
        "Vamos fazer um ótimo trabalho juntos! ✨"
      ],
      task_created: [
        "Perfeito! Tarefa criada com sucesso. Vamos colocar isso em prática! 🎯",
        "Ótima tarefa! Está pronto para começar?",
        "Tarefa adicionada! Que tal quebrarmos ela em pomodoros?"
      ],
      default: [
        "Entendi! Vamos continuar trabalhando juntos.",
        "Estou aqui para apoiar sua produtividade!",
        "Vamos manter o foco e alcançar seus objetivos!"
      ]
    };

    const responseArray = responses[action] || responses.default;
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  }

  /**
   * Gera sugestões de fallback baseadas no contexto do usuário
   */
  private generateFallbackSuggestions(context: LumiContextData): string[] {
    const suggestions = [];
    
    if (context.recentTasks.length === 0) {
      suggestions.push("Que tal criar sua primeira tarefa?");
    }
    
    if (context.statistics.averageCompletionRate < 50) {
      suggestions.push("Vamos focar em tarefas menores para aumentar sua motivação!");
    }
    
    if (context.garden.totalFlowers < 5) {
      suggestions.push("Complete mais tarefas para ganhar flores no seu jardim! 🌸");
    }
    
    suggestions.push("Lembre-se de fazer pausas regulares durante o trabalho!");
    
    return suggestions.slice(0, 3); // Máximo 3 sugestões
  }
  /**
   * Calcula o humor baseado na ação executada
   */
  private calculateMoodFromAction(actionType: string, memory: LumiMemory): LumiMoodType {
    switch (actionType) {
      case 'task_completed':
        return LumiMoodType.CELEBRATORY;
      case 'task_created':
        return LumiMoodType.ENCOURAGING;
      case 'pomodoro_started':
        return LumiMoodType.MOTIVATIONAL;
      case 'task_deleted':
        return LumiMoodType.SUPPORTIVE;
      default:
        return memory.currentMood; // Manter humor atual
    }
  }

  /**
   * Retorna pontuação de utilidade para diferentes ações
   */
  private getHelpfulnessScoreForAction(actionType: string): number {
    const scores = {
      'task_created': 5,
      'task_completed': 10,
      'task_updated': 3,
      'pomodoro_started': 7,
      'ai_interaction': 2,
      'task_deleted': 1
    };
    
    return scores[actionType] || 1;
  }

  /**
   * Gera uma resposta de ação para o histórico de conversação
   */
  private generateActionResponse(actionType: string): string {
    const responses = {
      'task_created': 'Tarefa criada com sucesso!',
      'task_completed': 'Parabéns por completar a tarefa!',
      'task_updated': 'Tarefa atualizada!',
      'task_deleted': 'Tarefa removida.',
      'pomodoro_started': 'Pomodoro iniciado! Foco total!',
      'ai_interaction': 'Conversa registrada.'
    };
    
    return responses[actionType] || 'Ação registrada.';
  }

  private getBestPerformanceDay(mostProductiveDays: Array<{ day: number; productivity: number }>): string {
    if (!mostProductiveDays || mostProductiveDays.length === 0) {
      return 'N/A';
    }
    
    const bestDay = mostProductiveDays.reduce((best, current) => 
      current.productivity > best.productivity ? current : best
    );
    
    return this.getDayName(bestDay.day);
  }

  private getDayName(dayNumber: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber] || 'monday';
  }
}
