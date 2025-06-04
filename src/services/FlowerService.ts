import { AppDataSource } from "../data-source";
import { Flower, FlowerType, FlowerColor } from "../entities/Flower";
import { Garden } from "../entities/Garden";
import { Task, TaskPriority } from "../entities/Task";
import { User } from "../entities/User";
import { Repository } from "typeorm";
import { LumiService } from "./LumiService";

export class FlowerService {
  private flowerRepository: Repository<Flower>;
  private gardenRepository: Repository<Garden>;
  private lumiService: LumiService;

  constructor() {
    this.flowerRepository = AppDataSource.getRepository(Flower);
    this.gardenRepository = AppDataSource.getRepository(Garden);
    this.lumiService = new LumiService();
  }async createFlowerForPomodoroCompletion(
    userId: string,
    taskId: string
  ): Promise<Flower | null> {
    try {
      console.log(`🌱 Iniciando criação de flor - Usuário: ${userId}, Tarefa: ${taskId}`);
      
      const recentDate = new Date(Date.now() - 30000); 
      const existingFlower = await this.flowerRepository.findOne({
        where: {
          user: { id: userId },
          task: { id: taskId },
        },
        order: { createdAt: "DESC" }
      });
      
      if (existingFlower && existingFlower.createdAt > recentDate) {
        console.log(`⚠️ Flor já existe para esta tarefa criada em ${existingFlower.createdAt.toISOString()}, evitando duplicação`);
        return existingFlower;
      }
      
      const taskRepository = AppDataSource.getRepository(Task);
      const task = await taskRepository.findOne({
        where: { id: taskId }
      });
      
      if (!task) {
        console.log('❌ Tarefa não encontrada com ID:', taskId);
        return null;
      }
      
      console.log(`📋 Criando flor para tarefa ${taskId} de título "${task.title}"`);
      
      if (!task.user) {
        console.log(`🔗 Associando tarefa ${taskId} ao usuário ${userId}`);
        task.user = { id: userId } as User;
        await taskRepository.save(task);
      }
      
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId }
      });
      
      if (!user) {
        console.log(`❌ Usuário ${userId} não encontrado`);
        return null;
      }

      const garden = await this.getOrCreateGarden(userId);
      const flowerColor = this.getFlowerColorByPriority(task.priority);
      
      if (task.priority === TaskPriority.HIGH) {
        garden.consecutiveHighPriorityPomodoros += 1;
        console.log(`🔥 Pomodoro de alta prioridade! Consecutivos: ${garden.consecutiveHighPriorityPomodoros}`);
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
        console.log(`🌟 Criando flor RARA!`);
      } else {
        this.updateGardenFlowerCount(garden, flowerColor);
        console.log(`🌻 Criando flor comum ${flowerColor}`);
      }

      garden.totalFlowers += 1;
      await this.gardenRepository.save(garden);

      console.log(`💾 Salvando flor no banco de dados...`);

      const flower = this.flowerRepository.create({
        type: flowerType,
        color: finalColor,
        earnedFromTaskTitle: task.title,
        user: { id: userId } as User,
        task: { id: taskId } as Task,
      });      const savedFlower = await this.flowerRepository.save(flower);
      console.log(`✅ Flor criada com sucesso: ID ${savedFlower.id}, Cor: ${savedFlower.color}, Tipo: ${savedFlower.type}`);
      
      // Notificar Lumi sobre a criação da flor
      try {
        if (savedFlower.type === FlowerType.RARE) {
          // Notificação especial para flores raras
          await this.lumiService.recordFlowerEarned(userId, {
            ...savedFlower,
            isRare: true,
            specialMessage: "Parabéns! Você conquistou uma flor rara!"
          });
        } else {
          await this.lumiService.recordFlowerEarned(userId, savedFlower);
        }
      } catch (error) {
        console.warn("Failed to notify Lumi about flower creation:", error);
      }
      
      return savedFlower;
    } catch (error) {
      console.error('❌ Erro ao criar flor para pomodoro:', error);
      throw error;
    }
  }
  async getUserFlowers(userId: string): Promise<Flower[]> {
    const flowers = await this.flowerRepository
      .createQueryBuilder("flower")
      .leftJoinAndSelect("flower.task", "task")
      .where("flower.user.id = :userId", { userId })
      .orderBy("flower.createdAt", "DESC")
      .getMany();
    
    console.log(`Encontradas ${flowers.length} flores para o usuário ${userId}`);
    return flowers;
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
