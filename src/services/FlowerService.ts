import { AppDataSource } from "../data-source";
import { Flower, FlowerType, FlowerColor } from "../entities/Flower";
import { Garden } from "../entities/Garden";
import { Task, TaskPriority } from "../entities/Task";
import { User } from "../entities/User";
import { Repository, MoreThanOrEqual, LessThan } from "typeorm";
import { logger } from "../utils/logger";

export class FlowerService {
  private flowerRepository: Repository<Flower>;
  private gardenRepository: Repository<Garden>;

  constructor() {
    this.flowerRepository = AppDataSource.getRepository(Flower);
    this.gardenRepository = AppDataSource.getRepository(Garden);
  }  async createFlowerForPomodoroCompletion(
    userId: string,
    taskId: string
  ): Promise<Flower | null> {
    try {
      // Verificar se já existe uma flor recente para evitar duplicação
      const recentDate = new Date(Date.now() - 30000);
      const existingFlower = await this.flowerRepository.findOne({
        where: {
          user: { id: userId },
          task: { id: taskId },
        },
        order: { createdAt: "DESC" },
      });

      if (existingFlower && existingFlower.createdAt > recentDate) {
        return existingFlower;
      }

      const taskRepository = AppDataSource.getRepository(Task);
      const task = await taskRepository.findOne({
        where: { id: taskId },
      });

      if (!task) {
        return null;
      }

      if (!task.user) {
        task.user = { id: userId } as User;
        await taskRepository.save(task);
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      const garden = await this.getOrCreateGarden(userId);
      const flowerColor = this.getFlowerColorByPriority(task.priority);

      if (task.priority === TaskPriority.HIGH) {
        garden.consecutiveHighPriorityPomodoros += 1;
      } else {
        garden.consecutiveHighPriorityPomodoros = 0;
      }

      let flowerType = FlowerType.COMMON;
      let finalColor = flowerColor;

      const shouldCreateRareFlower = await this.checkForRareFlower(
        userId,
        flowerColor
      );
      if (
        shouldCreateRareFlower ||
        garden.consecutiveHighPriorityPomodoros >= 3
      ) {
        flowerType = FlowerType.RARE;
        finalColor = FlowerColor.PURPLE;
        garden.consecutiveHighPriorityPomodoros = 0;
        garden.rareFlowers += 1;
      } else {
        this.updateGardenFlowerCount(garden, flowerColor);
      }

      garden.totalFlowers += 1;
      await this.gardenRepository.save(garden);

      const flower = this.flowerRepository.create({
        type: flowerType,
        color: finalColor,
        earnedFromTaskTitle: task.title,
        user: { id: userId } as User,
        task: { id: taskId } as Task,
      });
      
      const savedFlower = await this.flowerRepository.save(flower);
      return savedFlower;
    } catch (error) {
      // Log apenas erros críticos em produção
      if (process.env.NODE_ENV === 'production') {
        logger.error(`Erro ao criar flor para pomodoro:`, error);
      } else {
        logger.error("❌ Erro ao criar flor para pomodoro:", error);
      }
      throw error;
    }
  }  async getUserFlowers(userId: string): Promise<Flower[]> {
    return await this.flowerRepository
      .createQueryBuilder("flower")
      .leftJoinAndSelect("flower.task", "task")
      .where("flower.user.id = :userId", { userId })
      .orderBy("flower.createdAt", "DESC")
      .getMany();
  }
  async getUserGarden(userId: string): Promise<Garden> {
    return this.getOrCreateGarden(userId);
  }
  async getGardenStats(userId: string): Promise<any> {
    // Otimização: usar uma única query com agregação ao invés de buscar todas as flores
    const stats = await this.flowerRepository
      .createQueryBuilder("flower")
      .select([
        "COUNT(*) as totalFlowers",
        "SUM(CASE WHEN flower.color = 'GREEN' THEN 1 ELSE 0 END) as greenFlowers",
        "SUM(CASE WHEN flower.color = 'ORANGE' THEN 1 ELSE 0 END) as orangeFlowers", 
        "SUM(CASE WHEN flower.color = 'RED' THEN 1 ELSE 0 END) as redFlowers",
        "SUM(CASE WHEN flower.color = 'PURPLE' THEN 1 ELSE 0 END) as purpleFlowers",
        "SUM(CASE WHEN flower.type = 'RARE' THEN 1 ELSE 0 END) as rareFlowersCount"
      ])
      .where("flower.user.id = :userId", { userId })
      .getRawOne();

    // Para calcular streak consecutiva, ainda precisamos das flores mais recentes
    const recentFlowers = await this.flowerRepository.find({
      where: { user: { id: userId } },
      select: ["color", "createdAt"],
      order: { createdAt: "DESC" },
      take: 50 // Limitar para otimizar performance
    });

    return {
      totalFlowers: parseInt(stats.totalFlowers) || 0,
      flowersByType: {
        GREEN: parseInt(stats.greenFlowers) || 0,
        ORANGE: parseInt(stats.orangeFlowers) || 0,
        RED: parseInt(stats.redFlowers) || 0,
        PURPLE: parseInt(stats.purpleFlowers) || 0,
      },
      rareFlowersCount: parseInt(stats.rareFlowersCount) || 0,
      totalPomodorosCompleted: parseInt(stats.totalFlowers) || 0,
      consecutiveHighPriority: this.calculateConsecutiveHighPriority(recentFlowers),
    };
  }  async checkForRareFlower(
    userId: string,
    flowerColor: FlowerColor
  ): Promise<boolean> {
    try {
      // Otimização: verificar apenas as últimas 3 flores se for cor vermelha
      if (flowerColor === FlowerColor.RED) {
        const recentFlowers = await this.flowerRepository.find({
          where: { user: { id: userId } },
          select: ["color"],
          order: { createdAt: "DESC" },
          take: 3,
        });

        if (recentFlowers.length >= 3) {
          if (recentFlowers.every((f) => f.color === FlowerColor.RED)) {
            return true;
          }
        }
      }

      // Otimização: usar query mais eficiente para contar flores do dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);      const flowersToday = await this.flowerRepository.count({
        where: {
          user: { id: userId },
          createdAt: MoreThanOrEqual(today)
        }
      });

      if (flowersToday === 0) {
        return Math.random() < 0.1; // 10% chance para primeira flor do dia
      }

      return false;
    } catch (error) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        logger.error("Erro ao verificar flor rara:", error);
      }
      return false;
    }
  }

  private async getOrCreateGarden(userId: string): Promise<Garden> {
    let garden = await this.gardenRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!garden) {
      garden = this.gardenRepository.create({
        user: { id: userId } as User,
        totalFlowers: 0,
        greenFlowers: 0,
        orangeFlowers: 0,
        redFlowers: 0,
        rareFlowers: 0,
        consecutiveHighPriorityPomodoros: 0,
      });
      garden = await this.gardenRepository.save(garden);
    }

    return garden;
  }

  private getFlowerColorByPriority(priority: TaskPriority): FlowerColor {
    switch (priority) {
      case TaskPriority.LOW:
        return FlowerColor.GREEN;
      case TaskPriority.MEDIUM:
        return FlowerColor.ORANGE;
      case TaskPriority.HIGH:
        return FlowerColor.RED;
      default:
        return FlowerColor.GREEN;
    }
  }
  private updateGardenFlowerCount(garden: Garden, color: FlowerColor): void {
    switch (color) {
      case FlowerColor.GREEN:
        garden.greenFlowers += 1;
        break;
      case FlowerColor.ORANGE:
        garden.orangeFlowers += 1;
        break;
      case FlowerColor.RED:
        garden.redFlowers += 1;
        break;
    }
  }

  private calculateConsecutiveHighPriority(flowers: Flower[]): number {
    let consecutive = 0;
    let maxConsecutive = 0;

    for (const flower of flowers) {
      if (flower.color === FlowerColor.RED) {
        consecutive++;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      } else {
        consecutive = 0;
      }
    }

    return maxConsecutive;
  }
}
