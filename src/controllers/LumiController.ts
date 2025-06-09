import { Request, Response } from "express";
import { LumiService } from "../services/LumiService";

export class LumiController {
  private lumiService: LumiService;

  constructor() {
    this.lumiService = new LumiService();
  }

  async chat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { message } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (!message) {
        res.status(400).json({ message: "Mensagem é obrigatória" });
        return;
      }

      // Obter contexto completo do usuário
      const context = await this.lumiService.getFullUserContext(userId);

      // Enviar para Lumi AI
      const lumiResponse = await this.lumiService.sendToLumiAI({
        userId,
        message,
        context,
        action: "chat"
      });

      res.json(lumiResponse);
    } catch (error) {
      console.error("Error in Lumi chat:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getUserMemory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const memory = await this.lumiService.getOrCreateLumiMemory(userId);
      res.json(memory);
    } catch (error) {
      console.error("Error getting user memory:", error);
      res.status(500).json({ 
        message: "Erro ao obter memória do usuário",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getUserContext(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const context = await this.lumiService.getFullUserContext(userId);
      res.json(context);
    } catch (error) {
      console.error("Error getting user context:", error);
      res.status(500).json({ 
        message: "Erro ao obter contexto do usuário",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async updatePersonality(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { personalityUpdate } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const memory = await this.lumiService.getOrCreateLumiMemory(userId);
      
      if (personalityUpdate) {
        memory.personalityProfile = { 
          ...memory.personalityProfile, 
          ...personalityUpdate 
        };
        
        await this.lumiService.updateLumiMemory(userId);
      }

      res.json({ message: "Personalidade atualizada com sucesso", memory });
    } catch (error) {
      console.error("Error updating personality:", error);
      res.status(500).json({ 
        message: "Erro ao atualizar personalidade",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getConversationHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const memory = await this.lumiService.getOrCreateLumiMemory(userId);
      const history = memory.conversationHistory.slice(-limit);

      res.json({
        conversations: history,
        totalCount: memory.conversationHistory.length
      });
    } catch (error) {
      console.error("Error in getting conversation history:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // 🆕 NOVOS ENDPOINTS PARA AÇÕES DA LUMI

  /**
   * Endpoint para a Lumi executar ações no sistema
   */
  async executeAction(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { action, taskData, taskId, pomodoroData } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (!action) {
        res.status(400).json({ message: "Ação é obrigatória" });
        return;
      }

      const lumiAction = {
        type: action,
        taskData,
        taskId,
        pomodoroData
      };

      const result = await this.lumiService.executeLumiAction(userId, lumiAction);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in Lumi action execution:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Endpoint específico para criar tarefas via Lumi
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { title, description, priority, dueDate, estimatedPomodoros } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (!title) {
        res.status(400).json({ message: "Título da tarefa é obrigatório" });
        return;
      }

      const result = await this.lumiService.executeLumiAction(userId, {
        type: "create",
        taskData: {
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          estimatedPomodoros
        }
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in Lumi task creation:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Endpoint específico para atualizar tarefas via Lumi
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { taskId } = req.params;
      const { title, description, priority, dueDate, estimatedPomodoros } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (!taskId) {
        res.status(400).json({ message: "ID da tarefa é obrigatório" });
        return;
      }

      const result = await this.lumiService.executeLumiAction(userId, {
        type: "update",
        taskId,
        taskData: {
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          estimatedPomodoros
        }
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in Lumi task update:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Endpoint específico para deletar tarefas via Lumi
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { taskId } = req.params;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (!taskId) {
        res.status(400).json({ message: "ID da tarefa é obrigatório" });
        return;
      }

      const result = await this.lumiService.executeLumiAction(userId, {
        type: "delete",
        taskId
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in Lumi task deletion:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Endpoint específico para iniciar pomodoros via Lumi
   */
  async startPomodoro(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { taskId } = req.params;
      const { duration, notes } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (!taskId) {
        res.status(400).json({ message: "ID da tarefa é obrigatório" });
        return;
      }

      const result = await this.lumiService.executeLumiAction(userId, {
        type: "start_pomodoro",
        taskId,
        pomodoroData: { duration, notes }
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in Lumi pomodoro start:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
