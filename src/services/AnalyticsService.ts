import { Repository, Between } from "typeorm";
import { AppDataSource } from "../data-source";
import { PerformanceRecord } from "../entities/PerformanceRecord";
import { User } from "../entities/User";
import { Task, TaskStatus } from "../entities/Task";
import { Pomodoro, PomodoroStatus } from "../entities/Pomodoro";

export interface AnalyticsData {
  dailyStats: PerformanceRecord[];
  weeklyAverage: {
    tasksCompleted: number;
    pomodorosCompleted: number;
    focusTime: number;
    productivityScore: number;
  };
  monthlyTrends: {
    month: string;
    tasksCompleted: number;
    pomodorosCompleted: number;
    focusTime: number;
  }[];
  bestPerformanceDays: PerformanceRecord[];
  mostProductiveHours: Array<{
    hour: number;
    activityLevel: number;
  }>;
}

export class AnalyticsService {
  private performanceRepository: Repository<PerformanceRecord>;
  private userRepository: Repository<User>;
  private taskRepository: Repository<Task>;
  private pomodoroRepository: Repository<Pomodoro>;

  constructor() {
    this.performanceRepository = AppDataSource.getRepository(PerformanceRecord);
    this.userRepository = AppDataSource.getRepository(User);
    this.taskRepository = AppDataSource.getRepository(Task);
    this.pomodoroRepository = AppDataSource.getRepository(Pomodoro);
  }

  async updateDailyPerformance(userId: string, date: Date): Promise<PerformanceRecord> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tasksCompleted = await this.taskRepository.count({
      where: {
        user: { id: userId },
        status: TaskStatus.COMPLETED,
        completedAt: Between(startOfDay, endOfDay)
      }
    });

    const completedPomodoros = await this.pomodoroRepository.find({
      where: {
        task: { user: { id: userId } },
        status: PomodoroStatus.COMPLETED,
        endTime: Between(startOfDay, endOfDay)
      }
    });

    const focusTimeMinutes = completedPomodoros.reduce((total, pomodoro) => {
      return total + (pomodoro.duration / 60);
    }, 0);

    const hourlyActivity = this.calculateHourlyActivity(completedPomodoros);
    const productivityScore = this.calculateProductivityScore(tasksCompleted, focusTimeMinutes);

    let performanceRecord = await this.performanceRepository.findOne({
      where: { userId, date: startOfDay }
    });

    if (performanceRecord) {
      performanceRecord.tasksCompleted = tasksCompleted;
      performanceRecord.pomodorosCompleted = completedPomodoros.length;
      performanceRecord.focusTimeMinutes = focusTimeMinutes;
      performanceRecord.productivityScore = productivityScore;
      performanceRecord.hourlyActivity = hourlyActivity;
    } else {
      performanceRecord = this.performanceRepository.create({
        userId,
        date: startOfDay,
        tasksCompleted,
        pomodorosCompleted: completedPomodoros.length,
        focusTimeMinutes,
        productivityScore,
        hourlyActivity
      });
    }

    return await this.performanceRepository.save(performanceRecord);
  }

  private calculateHourlyActivity(pomodoros: Pomodoro[]): Record<number, number> {
    const hourlyActivity: Record<number, number> = {};
    
    for (let hour = 0; hour < 24; hour++) {
      hourlyActivity[hour] = 0;
    }

    pomodoros.forEach(pomodoro => {
      if (pomodoro.startTime) {
        const hour = pomodoro.startTime.getHours();
        hourlyActivity[hour] += pomodoro.duration / 60;
      }
    });

    return hourlyActivity;
  }

  private calculateProductivityScore(tasksCompleted: number, focusTimeMinutes: number): number {
    const taskScore = tasksCompleted * 10;
    const focusScore = focusTimeMinutes * 0.5;
    const totalScore = taskScore + focusScore;
    
    return Math.min(totalScore / 100, 5.0);
  }

  async getAnalytics(userId: string, days: number = 30): Promise<AnalyticsData> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyStats = await this.performanceRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate)
      },
      order: { date: "DESC" }
    });

    const weeklyAverage = this.calculateWeeklyAverage(dailyStats);
    const monthlyTrends = this.calculateMonthlyTrends(dailyStats);
    const bestPerformanceDays = this.getBestPerformanceDays(dailyStats);
    const mostProductiveHours = this.getMostProductiveHours(dailyStats);

    return {
      dailyStats,
      weeklyAverage,
      monthlyTrends,
      bestPerformanceDays,
      mostProductiveHours
    };
  }

  private calculateWeeklyAverage(records: PerformanceRecord[]) {
    if (records.length === 0) {
      return {
        tasksCompleted: 0,
        pomodorosCompleted: 0,
        focusTime: 0,
        productivityScore: 0
      };
    }

    const totals = records.reduce((acc, record) => ({
      tasksCompleted: acc.tasksCompleted + record.tasksCompleted,
      pomodorosCompleted: acc.pomodorosCompleted + record.pomodorosCompleted,
      focusTime: acc.focusTime + Number(record.focusTimeMinutes),
      productivityScore: acc.productivityScore + Number(record.productivityScore)
    }), { tasksCompleted: 0, pomodorosCompleted: 0, focusTime: 0, productivityScore: 0 });

    const count = records.length;
    return {
      tasksCompleted: Math.round(totals.tasksCompleted / count * 100) / 100,
      pomodorosCompleted: Math.round(totals.pomodorosCompleted / count * 100) / 100,
      focusTime: Math.round(totals.focusTime / count * 100) / 100,
      productivityScore: Math.round(totals.productivityScore / count * 100) / 100
    };
  }

  private calculateMonthlyTrends(records: PerformanceRecord[]) {
    const monthlyData: Record<string, { tasksCompleted: number; pomodorosCompleted: number; focusTime: number; count: number }> = {};

    records.forEach(record => {
      const monthKey = record.date.toISOString().substring(0, 7);
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { tasksCompleted: 0, pomodorosCompleted: 0, focusTime: 0, count: 0 };
      }

      monthlyData[monthKey].tasksCompleted += record.tasksCompleted;
      monthlyData[monthKey].pomodorosCompleted += record.pomodorosCompleted;
      monthlyData[monthKey].focusTime += Number(record.focusTimeMinutes);
      monthlyData[monthKey].count++;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      tasksCompleted: Math.round(data.tasksCompleted / data.count * 100) / 100,
      pomodorosCompleted: Math.round(data.pomodorosCompleted / data.count * 100) / 100,
      focusTime: Math.round(data.focusTime / data.count * 100) / 100
    }));
  }

  private getBestPerformanceDays(records: PerformanceRecord[]): PerformanceRecord[] {
    return records
      .sort((a, b) => Number(b.productivityScore) - Number(a.productivityScore))
      .slice(0, 5);
  }

  private getMostProductiveHours(records: PerformanceRecord[]) {
    const hourlyTotals: Record<number, number> = {};
    
    for (let hour = 0; hour < 24; hour++) {
      hourlyTotals[hour] = 0;
    }

    records.forEach(record => {
      if (record.hourlyActivity) {
        Object.entries(record.hourlyActivity).forEach(([hour, activity]) => {
          hourlyTotals[parseInt(hour)] += Number(activity);
        });
      }
    });

    return Object.entries(hourlyTotals)
      .map(([hour, activityLevel]) => ({
        hour: parseInt(hour),
        activityLevel: Math.round(activityLevel * 100) / 100
      }))
      .sort((a, b) => b.activityLevel - a.activityLevel)
      .slice(0, 6);
  }
}
