import { Request, Response } from "express";
import { StreakService } from "../services/StreakService";

export class StreakController {
  private streakService: StreakService;

  constructor() {
    this.streakService = new StreakService();
  }

  getStreak = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const streak = await this.streakService.getUserStreak(userId);

      res.json(streak);
    } catch (error) {
      console.error("Erro ao buscar sequência:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  updateStreak = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const streak = await this.streakService.updateStreak(userId);

      res.json(streak);
    } catch (error) {
      console.error("Erro ao atualizar sequência:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  checkStreakBreak = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const streak = await this.streakService.checkStreakBreak(userId);

      res.json(streak);
    } catch (error) {
      console.error("Erro ao verificar quebra de sequência:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  getStreakStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const stats = await this.streakService.getStreakStats(userId);

      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas de sequência:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };
}
