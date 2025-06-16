import { Request, Response } from "express";
import { GoalService } from "../services/GoalService";
import { GoalType, GoalCategory } from "../entities/Goal";

export class GoalController {
  private goalService: GoalService;

  constructor() {
    this.goalService = new GoalService();
  }

  createGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const {
        title,
        description,
        type,
        category,
        targetValue,
        startDate,
        endDate
      } = req.body;

      if (!title || !type || !category || !targetValue || !startDate || !endDate) {
        res.status(400).json({ error: "Campos obrigatórios faltando" });
        return;
      }

      const goal = await this.goalService.createGoal({
        userId,
        title,
        description,
        type: type as GoalType,
        category: category as GoalCategory,
        targetValue: parseFloat(targetValue),
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });

      res.status(201).json(goal);
    } catch (error) {
      console.error("Erro ao criar meta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  getUserGoals = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const { status } = req.query;
      const goals = await this.goalService.getUserGoals(userId, status as any);

      res.json(goals);
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  updateGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const { goalId } = req.params;
      const updateData = req.body;

      const goal = await this.goalService.updateGoal(goalId, userId, updateData);

      res.json(goal);
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  deleteGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const { goalId } = req.params;
      const deleted = await this.goalService.deleteGoal(goalId, userId);

      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Meta não encontrada" });
      }
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  getGoalsByType = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const { type } = req.params;
      const goals = await this.goalService.getGoalsByType(userId, type as GoalType);

      res.json(goals);
    } catch (error) {
      console.error("Erro ao buscar metas por tipo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  updateGoalProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { goalId } = req.params;
      const { currentValue } = req.body;

      if (currentValue === undefined) {
        res.status(400).json({ error: "Valor atual é obrigatório" });
        return;
      }

      const goal = await this.goalService.updateGoalProgress(goalId, parseFloat(currentValue));

      res.json(goal);
    } catch (error) {
      console.error("Erro ao atualizar progresso da meta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  checkGoals = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await this.goalService.checkAndUpdateGoals(userId);

      res.json({ message: "Metas verificadas com sucesso" });
    } catch (error) {
      console.error("Erro ao verificar metas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };
}
