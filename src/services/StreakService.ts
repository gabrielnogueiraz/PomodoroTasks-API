import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { AppDataSource } from "../data-source";
import { Streak } from "../entities/Streak";
import { User } from "../entities/User";
import { Task, TaskStatus } from "../entities/Task";

export class StreakService {
  private streakRepository: Repository<Streak>;
  private userRepository: Repository<User>;
  private taskRepository: Repository<Task>;

  constructor() {
    this.streakRepository = AppDataSource.getRepository(Streak);
    this.userRepository = AppDataSource.getRepository(User);
    this.taskRepository = AppDataSource.getRepository(Task);
  }

  async initializeUserStreak(userId: string): Promise<Streak> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    let streak = await this.streakRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!streak) {
      streak = this.streakRepository.create({
        user,
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        streakHistory: []
      });
      
      streak = await this.streakRepository.save(streak);
    }

    return streak;
  }

  async updateStreak(userId: string): Promise<Streak> {
    const streak = await this.initializeUserStreak(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hasCompletedTaskToday = await this.hasUserCompletedTaskOnDate(userId, today);

    if (!hasCompletedTaskToday) {
      return streak;
    }

    const lastActivityDate = streak.lastActivityDate;
    const isConsecutiveDay = lastActivityDate && this.isSameDate(lastActivityDate, yesterday);
    const isFirstActivityToday = !lastActivityDate || !this.isSameDate(lastActivityDate, today);

    if (isFirstActivityToday) {
      if (isConsecutiveDay) {
        streak.currentStreak += 1;
      } else if (!lastActivityDate || !this.isSameDate(lastActivityDate, today)) {
        if (lastActivityDate && this.daysBetween(lastActivityDate, today) > 1) {
          this.endCurrentStreak(streak);
        }
        streak.currentStreak = 1;
        streak.streakStartDate = today;
      }

      streak.lastActivityDate = today;
      streak.totalActiveDays += 1;

      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }

      await this.streakRepository.save(streak);
    }

    return streak;
  }

  async checkStreakBreak(userId: string): Promise<Streak> {
    const streak = await this.initializeUserStreak(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (streak.lastActivityDate && streak.currentStreak > 0) {
      const daysSinceLastActivity = this.daysBetween(streak.lastActivityDate, today);
      
      if (daysSinceLastActivity > 1) {
        this.endCurrentStreak(streak);
        streak.currentStreak = 0;
        streak.streakStartDate = null;
        await this.streakRepository.save(streak);
      }
    }

    return streak;
  }
  private async hasUserCompletedTaskOnDate(userId: string, date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const completedTask = await this.taskRepository.findOne({
      where: {
        user: { id: userId },
        status: TaskStatus.COMPLETED,
        completedAt: Between(startOfDay, endOfDay)
      }
    });

    return !!completedTask;
  }

  private endCurrentStreak(streak: Streak): void {
    if (streak.currentStreak > 0 && streak.streakStartDate) {
      const streakHistory = streak.streakHistory || [];
      streakHistory.push({
        startDate: streak.streakStartDate,
        endDate: streak.lastActivityDate || new Date(),
        length: streak.currentStreak
      });
      streak.streakHistory = streakHistory;
    }
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async getUserStreak(userId: string): Promise<Streak> {
    return await this.initializeUserStreak(userId);
  }

  async getStreakStats(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    streakHistory: Array<{ startDate: Date; endDate: Date; length: number }>;
    isActiveToday: boolean;
  }> {
    const streak = await this.getUserStreak(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isActiveToday = await this.hasUserCompletedTaskOnDate(userId, today);

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalActiveDays: streak.totalActiveDays,
      streakHistory: streak.streakHistory || [],
      isActiveToday
    };
  }
}
