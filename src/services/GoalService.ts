import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Goal, GoalStatus, GoalType, GoalCategory } from "../entities/Goal";
import { User } from "../entities/User";

export class GoalService {
  private goalRepository: Repository<Goal>;
  private userRepository: Repository<User>;

  constructor() {
    this.goalRepository = AppDataSource.getRepository(Goal);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createGoal(goalData: {
    userId: string;
    title: string;
    description?: string;
    type: GoalType;
    category: GoalCategory;
    targetValue: number;
    startDate: Date;
    endDate: Date;
  }): Promise<Goal> {
    const user = await this.userRepository.findOne({
      where: { id: goalData.userId }
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const goal = this.goalRepository.create({
      ...goalData,
      user,
      status: GoalStatus.ACTIVE,
    });

    return await this.goalRepository.save(goal);
  }

  async getUserGoals(userId: string, status?: GoalStatus): Promise<Goal[]> {
    const whereConditions: any = { user: { id: userId } };
    
    if (status) {
      whereConditions.status = status;
    }

    return await this.goalRepository.find({
      where: whereConditions,
      order: { createdAt: "DESC" },
    });
  }

  async updateGoalProgress(goalId: string, currentValue: number): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId },
    });

    if (!goal) {
      throw new Error("Meta não encontrada");
    }

    goal.currentValue = currentValue;

    if (currentValue >= goal.targetValue && goal.status === GoalStatus.ACTIVE) {
      goal.status = GoalStatus.COMPLETED;
      goal.completedAt = new Date();
    }

    return await this.goalRepository.save(goal);
  }

  async checkAndUpdateGoals(userId: string): Promise<void> {
    const activeGoals = await this.getUserGoals(userId, GoalStatus.ACTIVE);
    const now = new Date();

    for (const goal of activeGoals) {
      if (goal.endDate < now && goal.status === GoalStatus.ACTIVE) {
        goal.status = GoalStatus.FAILED;
        await this.goalRepository.save(goal);
      }
    }
  }

  async getGoalsByType(userId: string, type: GoalType): Promise<Goal[]> {
    return await this.goalRepository.find({
      where: { 
        user: { id: userId },
        type,
        status: GoalStatus.ACTIVE
      },
      order: { createdAt: "DESC" },
    });
  }

  async deleteGoal(goalId: string, userId: string): Promise<boolean> {
    const result = await this.goalRepository.delete({
      id: goalId,
      user: { id: userId }
    });

    return result.affected > 0;
  }

  async updateGoal(
    goalId: string,
    userId: string,
    updateData: Partial<Goal>
  ): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, user: { id: userId } },
    });

    if (!goal) {
      throw new Error("Meta não encontrada");
    }

    Object.assign(goal, updateData);
    return await this.goalRepository.save(goal);
  }
}
