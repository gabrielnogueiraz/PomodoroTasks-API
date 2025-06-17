import { Request, Response } from "express";
import { ProductivityAnalyticsService } from "../services/ProductivityAnalyticsService";
import { logger } from "../utils/logger";

export class ProductivityAnalyticsController {
  private analyticsService = new ProductivityAnalyticsService();
  // Obter insights de produtividade
  getProductivityInsights = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { days = 30 } = req.query;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const insights = await this.analyticsService.getProductivityInsights(
        userId,
        parseInt(days as string)
      );
      
      res.json({
        message: "Insights de produtividade obtidos com sucesso",
        insights,
      });
    } catch (error) {
      logger.error("Erro ao obter insights de produtividade", "ANALYTICS_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Registrar conclusão de tarefa (webhook interno)
  recordTaskCompletion = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { taskId, completionTime } = req.body;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await this.analyticsService.recordTaskCompletion(userId, taskId, completionTime);
      
      res.json({
        message: "Conclusão de tarefa registrada com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao registrar conclusão de tarefa", "ANALYTICS_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Registrar sessão de Pomodoro (webhook interno)
  recordPomodoroSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { duration, goalId } = req.body;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await this.analyticsService.recordPomodoroSession(userId, duration, goalId);
      
      res.json({
        message: "Sessão de Pomodoro registrada com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao registrar sessão de Pomodoro", "ANALYTICS_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Registrar progresso da meta (webhook interno)
  recordGoalProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { goalId, progressPercentage } = req.body;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await this.analyticsService.recordGoalProgress(userId, goalId, progressPercentage);
      
      res.json({
        message: "Progresso da meta registrado com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao registrar progresso da meta", "ANALYTICS_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
}
