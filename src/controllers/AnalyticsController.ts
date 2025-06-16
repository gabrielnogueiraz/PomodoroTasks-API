import { Request, Response } from "express";
import { AnalyticsService } from "../services/AnalyticsService";

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const { days } = req.query;
      const daysCount = days ? parseInt(days as string) : 30;

      const analytics = await this.analyticsService.getAnalytics(userId, daysCount);

      res.json(analytics);
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  updateDailyPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const { date } = req.body;
      const targetDate = date ? new Date(date) : new Date();

      const performance = await this.analyticsService.updateDailyPerformance(userId, targetDate);

      res.json(performance);
    } catch (error) {
      console.error("Erro ao atualizar performance diária:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  getDailyPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const { date } = req.params;
      const targetDate = new Date(date);

      await this.analyticsService.updateDailyPerformance(userId, targetDate);
      const analytics = await this.analyticsService.getAnalytics(userId, 1);

      res.json(analytics.dailyStats[0] || null);
    } catch (error) {
      console.error("Erro ao buscar performance diária:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };
}
