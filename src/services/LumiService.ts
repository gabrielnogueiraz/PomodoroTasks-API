import { AppDataSource } from "../data-source";
import { LumiMemory, LumiMoodType } from "../entities/LumiMemory";
import { User } from "../entities/User";
import { Task } from "../entities/Task";
import { Flower } from "../entities/Flower";
import { Garden } from "../entities/Garden";
import { Repository } from "typeorm";
import { LumiContextData } from "../types/lumi.types";

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
  }

  async getFullUserContext(userId: string): Promise<LumiContextData> {
    const [user, recentTasks, recentFlowers, memory] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId },
        relations: ["garden"]
      }),
      this.taskRepository.find({
        where: { user: { id: userId } },
        order: { updatedAt: "DESC" },
        take: 10
      }),
      this.flowerRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: "DESC" },
        take: 5
      }),
      this.getOrCreateLumiMemory(userId)
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
        currentStreak: memory.achievements.currentStreak,
        averageCompletionRate: completionRate,
        mostProductiveTimeOfDay: this.calculateMostProductiveTime(recentTasks)
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
}
