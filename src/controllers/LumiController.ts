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
      const { limit = 10 } = req.query;

      if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const memory = await this.lumiService.getOrCreateLumiMemory(userId);
      const history = memory.conversationHistory
        .slice(-Number(limit))
        .reverse();

      res.json(history);
    } catch (error) {
      console.error("Error getting conversation history:", error);
      res.status(500).json({ 
        message: "Erro ao obter histórico de conversas",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
