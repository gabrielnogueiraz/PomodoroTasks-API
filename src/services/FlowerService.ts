import { AppDataSource } from "../data-source";
import { Flower, FlowerType, FlowerColor } from "../entities/Flower";
import { Garden } from "../entities/Garden";
import { Task, TaskPriority } from "../entities/Task";
import { User } from "../entities/User";
import { Repository } from "typeorm";

export class FlowerService {
  private flowerRepository: Repository<Flower>;
  private gardenRepository: Repository<Garden>;

  constructor() {
    this.flowerRepository = AppDataSource.getRepository(Flower);
    this.gardenRepository = AppDataSource.getRepository(Garden);
  }
  async createFlowerForPomodoroCompletion(
    userId: string,
    taskId: string
  ): Promise<Flower | null> {
    try {      const task = await AppDataSource.getRepository(Task).findOne({
        where: { id: taskId },
        relations: ["user"],
      });

      if (!task || !task.user || task.user.id !== userId) {
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

      const shouldCreateRareFlower = await this.checkForRareFlower(userId, flowerColor);
      if (shouldCreateRareFlower || garden.consecutiveHighPriorityPomodoros >= 3) {
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

      return this.flowerRepository.save(flower);
    } catch (error) {
      console.error('Erro ao criar flor para pomodoro:', error);
      throw error;
    }
  }

  async getUserFlowers(userId: string): Promise<Flower[]> {
    return this.flowerRepository.find({
      where: { user: { id: userId } },
      relations: ["task"],
      order: { createdAt: "DESC" },
    });
  }
  async getUserGarden(userId: string): Promise<Garden> {
    return this.getOrCreateGarden(userId);
  }

  async getGardenStats(userId: string): Promise<any> {
    const flowers = await this.flowerRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });

    const stats = {
      totalFlowers: flowers.length,
      flowersByType: {
        GREEN: flowers.filter(f => f.color === FlowerColor.GREEN).length,
        ORANGE: flowers.filter(f => f.color === FlowerColor.ORANGE).length,
        RED: flowers.filter(f => f.color === FlowerColor.RED).length,
        PURPLE: flowers.filter(f => f.color === FlowerColor.PURPLE).length,
      },
      rareFlowersCount: flowers.filter(f => f.type === FlowerType.RARE).length,
      totalPomodorosCompleted: flowers.length,
      consecutiveHighPriority: this.calculateConsecutiveHighPriority(flowers),
    };

    return stats;
  }
  async checkForRareFlower(userId: string, flowerColor: FlowerColor): Promise<boolean> {
    try {
      const recentFlowers = await this.flowerRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: "DESC" },
        take: 4,
      });

      if (flowerColor === FlowerColor.RED && recentFlowers.length >= 3) {
        const lastThree = recentFlowers.slice(0, 3);
        if (lastThree.every(f => f.color === FlowerColor.RED)) {
          return true;
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const flowersToday = await this.flowerRepository.createQueryBuilder("flower")
        .where("flower.userId = :userId", { userId })
        .andWhere("DATE(flower.createdAt) = DATE(:today)", { today: today.toISOString().split('T')[0] })
        .getCount();

      if (flowersToday === 0) {
        return Math.random() < 0.1;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar flor rara:', error);
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
