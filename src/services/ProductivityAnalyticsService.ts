import { AppDataSource } from "../data-source";
import { ProductivityAnalytics, ProductivityMetricType } from "../entities/ProductivityAnalytics";
import { User } from "../entities/User";
import { Task, TaskStatus } from "../entities/Task";
import { Pomodoro } from "../entities/Pomodoro";
import { Goal } from "../entities/Goal";
import { Between } from "typeorm";
import { logger } from "../utils/logger";

export interface ProductivityInsights {
  mostProductiveHours: Array<{ hour: number; productivity: number }>;
  mostProductiveDays: Array<{ day: number; productivity: number }>;
  averageFocusTime: number;
  tasksCompletionRate: number;
  goalProgressRate: number;
  recommendations: string[];
  weeklyTrends: Array<{ week: string; productivity: number }>;
  monthlyTrends: Array<{ month: string; productivity: number }>;
}

export interface ProductivityPattern {
  type: 'hourly' | 'daily' | 'weekly';
  peak: number;
  average: number;
  low: number;
  patterns: Record<string, number>;
}

export class ProductivityAnalyticsService {
  private analyticsRepository = AppDataSource.getRepository(ProductivityAnalytics);
  private userRepository = AppDataSource.getRepository(User);
  private taskRepository = AppDataSource.getRepository(Task);
  private pomodoroRepository = AppDataSource.getRepository(Pomodoro);
  private goalRepository = AppDataSource.getRepository(Goal);

  async recordMetric(
    userId: string,
    metricType: ProductivityMetricType,
    value: number,
    date: Date = new Date(),
    goalId?: string,
    metadata?: Record<string, any>
  ): Promise<ProductivityAnalytics> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      const goal = goalId ? await this.goalRepository.findOne({ where: { id: goalId } }) : null;

      const analytics = this.analyticsRepository.create({
        metricType,
        value,
        date,
        hour: date.getHours(),
        dayOfWeek: date.getDay(),
        metadata: metadata || {},
        user,
        goal,
      });

      const savedAnalytics = await this.analyticsRepository.save(analytics);
      logger.info(`Métrica ${metricType} registrada para usuário ${userId}`, "ANALYTICS");
      
      return savedAnalytics;
    } catch (error) {
      logger.error("Erro ao registrar métrica de produtividade", "ANALYTICS", error);
      throw error;
    }
  }

  async getProductivityInsights(userId: string, days: number = 30): Promise<ProductivityInsights> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const endDate = new Date();

      // Buscar métricas do período
      const metrics = await this.analyticsRepository.find({
        where: {
          user: { id: userId },
          date: Between(startDate, endDate),
        },
        relations: ["goal"],
      });

      // Analisar produtividade por hora
      const hourlyProductivity = this.analyzeHourlyProductivity(metrics);
      
      // Analisar produtividade por dia da semana
      const dailyProductivity = this.analyzeDailyProductivity(metrics);
      
      // Calcular tempo médio de foco
      const averageFocusTime = await this.calculateAverageFocusTime(userId, startDate, endDate);
      
      // Calcular taxa de conclusão de tarefas
      const tasksCompletionRate = await this.calculateTasksCompletionRate(userId, startDate, endDate);
      
      // Calcular taxa de progresso das metas
      const goalProgressRate = await this.calculateGoalProgressRate(userId, startDate, endDate);
      
      // Gerar recomendações
      const recommendations = this.generateRecommendations(
        hourlyProductivity,
        dailyProductivity,
        averageFocusTime,
        tasksCompletionRate
      );

      // Tendências semanais e mensais
      const weeklyTrends = this.analyzeWeeklyTrends(metrics);
      const monthlyTrends = this.analyzeMonthlyTrends(metrics);

      return {
        mostProductiveHours: hourlyProductivity,
        mostProductiveDays: dailyProductivity,
        averageFocusTime,
        tasksCompletionRate,
        goalProgressRate,
        recommendations,
        weeklyTrends,
        monthlyTrends,
      };
    } catch (error) {
      logger.error("Erro ao gerar insights de produtividade", "ANALYTICS", error);
      throw error;
    }
  }

  private analyzeHourlyProductivity(metrics: ProductivityAnalytics[]): Array<{ hour: number; productivity: number }> {
    const hourlyData: Record<number, number[]> = {};
    
    // Agrupar métricas por hora
    metrics.forEach(metric => {
      if (metric.hour !== null) {
        if (!hourlyData[metric.hour]) {
          hourlyData[metric.hour] = [];
        }
        hourlyData[metric.hour].push(metric.value);
      }
    });

    // Calcular produtividade média por hora
    const hourlyProductivity = Object.entries(hourlyData).map(([hour, values]) => ({
      hour: parseInt(hour),
      productivity: values.reduce((sum, val) => sum + val, 0) / values.length,
    }));

    return hourlyProductivity.sort((a, b) => b.productivity - a.productivity);
  }

  private analyzeDailyProductivity(metrics: ProductivityAnalytics[]): Array<{ day: number; productivity: number }> {
    const dailyData: Record<number, number[]> = {};
    
    // Agrupar métricas por dia da semana
    metrics.forEach(metric => {
      if (metric.dayOfWeek !== null) {
        if (!dailyData[metric.dayOfWeek]) {
          dailyData[metric.dayOfWeek] = [];
        }
        dailyData[metric.dayOfWeek].push(metric.value);
      }
    });

    // Calcular produtividade média por dia
    const dailyProductivity = Object.entries(dailyData).map(([day, values]) => ({
      day: parseInt(day),
      productivity: values.reduce((sum, val) => sum + val, 0) / values.length,
    }));

    return dailyProductivity.sort((a, b) => b.productivity - a.productivity);
  }
  private async calculateAverageFocusTime(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const pomodoros = await this.pomodoroRepository.find({
      where: {
        task: { user: { id: userId } },
        startTime: Between(startDate, endDate),
        status: "completed" as any,
      },
      relations: ["task", "task.user"],
    });

    if (pomodoros.length === 0) return 0;

    const totalFocusTime = pomodoros.reduce((sum, pomodoro) => {
      if (pomodoro.endTime && pomodoro.startTime) {
        return sum + (pomodoro.endTime.getTime() - pomodoro.startTime.getTime());
      }
      return sum;
    }, 0);

    return totalFocusTime / pomodoros.length / (1000 * 60); // em minutos
  }

  private async calculateTasksCompletionRate(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const [completedTasks, totalTasks] = await Promise.all([
      this.taskRepository.count({
        where: {
          user: { id: userId },
          status: TaskStatus.COMPLETED,
          completedAt: Between(startDate, endDate),
        },
      }),
      this.taskRepository.count({
        where: {
          user: { id: userId },
          createdAt: Between(startDate, endDate),
        },
      }),
    ]);

    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }

  private async calculateGoalProgressRate(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const goals = await this.goalRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(startDate, endDate),
      },
    });

    if (goals.length === 0) return 0;

    const totalProgress = goals.reduce((sum, goal) => {
      const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);

    return totalProgress / goals.length;
  }

  private generateRecommendations(
    hourlyProductivity: Array<{ hour: number; productivity: number }>,
    dailyProductivity: Array<{ day: number; productivity: number }>,
    averageFocusTime: number,
    tasksCompletionRate: number
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas na produtividade por hora
    if (hourlyProductivity.length > 0) {
      const mostProductiveHour = hourlyProductivity[0];
      recommendations.push(
        `Seu horário mais produtivo é às ${mostProductiveHour.hour}h. Tente agendar suas tarefas mais importantes neste período.`
      );
    }

    // Recomendações baseadas na produtividade por dia
    if (dailyProductivity.length > 0) {
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const mostProductiveDay = dailyProductivity[0];
      recommendations.push(
        `${dayNames[mostProductiveDay.day]} é seu dia mais produtivo da semana. Considere planejar tarefas importantes para este dia.`
      );
    }

    // Recomendações baseadas no tempo de foco
    if (averageFocusTime < 20) {
      recommendations.push(
        "Seu tempo médio de foco está baixo. Tente eliminar distrações e usar a técnica Pomodoro para melhorar a concentração."
      );
    } else if (averageFocusTime > 45) {
      recommendations.push(
        "Você tem bom tempo de foco! Considere fazer pausas regulares para manter a produtividade."
      );
    }

    // Recomendações baseadas na taxa de conclusão
    if (tasksCompletionRate < 60) {
      recommendations.push(
        "Sua taxa de conclusão de tarefas pode melhorar. Tente quebrar tarefas grandes em partes menores e mais gerenciáveis."
      );
    } else if (tasksCompletionRate > 80) {
      recommendations.push(
        "Excelente taxa de conclusão! Você pode considerar aceitar desafios maiores ou mais tarefas."
      );
    }

    return recommendations;
  }

  private analyzeWeeklyTrends(metrics: ProductivityAnalytics[]): Array<{ week: string; productivity: number }> {
    const weeklyData: Record<string, number[]> = {};
    
    metrics.forEach(metric => {
      const week = this.getWeekKey(metric.date);
      if (!weeklyData[week]) {
        weeklyData[week] = [];
      }
      weeklyData[week].push(metric.value);
    });

    return Object.entries(weeklyData)
      .map(([week, values]) => ({
        week,
        productivity: values.reduce((sum, val) => sum + val, 0) / values.length,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  private analyzeMonthlyTrends(metrics: ProductivityAnalytics[]): Array<{ month: string; productivity: number }> {
    const monthlyData: Record<string, number[]> = {};
    
    metrics.forEach(metric => {
      const month = `${metric.date.getFullYear()}-${(metric.date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(metric.value);
    });

    return Object.entries(monthlyData)
      .map(([month, values]) => ({
        month,
        productivity: values.reduce((sum, val) => sum + val, 0) / values.length,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  async recordTaskCompletion(userId: string, taskId: string, completionTime: number): Promise<void> {
    try {
      const currentHour = new Date().getHours();
      let productivityScore = 100;

      // Ajustar score baseado no horário (exemplo de lógica)
      if (currentHour >= 9 && currentHour <= 11) {
        productivityScore *= 1.2; // Manhã produtiva
      } else if (currentHour >= 14 && currentHour <= 16) {
        productivityScore *= 1.1; // Tarde produtiva
      } else if (currentHour >= 22 || currentHour <= 6) {
        productivityScore *= 0.8; // Horário menos ideal
      }

      await this.recordMetric(
        userId,
        ProductivityMetricType.TASK_COMPLETION_RATE,
        productivityScore,
        new Date(),
        undefined,
        {
          taskId,
          completionTime,
          hour: currentHour,
        }
      );
    } catch (error) {
      logger.error("Erro ao registrar conclusão de tarefa", "ANALYTICS", error);
    }
  }

  async recordPomodoroSession(userId: string, duration: number, goalId?: string): Promise<void> {
    try {
      await this.recordMetric(
        userId,
        ProductivityMetricType.FOCUS_DURATION,
        duration,
        new Date(),
        goalId,
        {
          sessionDuration: duration,
        }
      );
    } catch (error) {
      logger.error("Erro ao registrar sessão de Pomodoro", "ANALYTICS", error);
    }
  }

  async recordGoalProgress(userId: string, goalId: string, progressPercentage: number): Promise<void> {
    try {
      await this.recordMetric(
        userId,
        ProductivityMetricType.GOAL_PROGRESS_RATE,
        progressPercentage,
        new Date(),
        goalId,
        {
          progressPercentage,
        }
      );
    } catch (error) {
      logger.error("Erro ao registrar progresso da meta", "ANALYTICS", error);
    }
  }
}
