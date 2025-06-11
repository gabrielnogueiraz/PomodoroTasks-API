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

      const context = await this.lumiService.getFullUserContext(userId);

      res.json({
        lumiAIUrl: this.lumiService.getLumiAIUrl(),
        context,
        message:
          "Use o lumiAIUrl para comunicação direta com a Lumi AI independente",
        instructions: {
          endpoint: "/api/chat",
          method: "POST",
          payload: {
            user_id: userId,
            message: message,
            context: context,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error",
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
      res.status(500).json({
        message: "Erro ao obter memória do usuário",
        error: error instanceof Error ? error.message : "Unknown error",
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
      res.status(500).json({
        message: "Erro ao obter contexto do usuário",
        error: error instanceof Error ? error.message : "Unknown error",
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
          ...personalityUpdate,
        };

        await this.lumiService.updateLumiMemory(userId);
      }

      res.json({
        message: "Perfil de personalidade atualizado com sucesso",
        personalityProfile: memory.personalityProfile,
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro ao atualizar perfil de personalidade",
        error: error instanceof Error ? error.message : "Unknown error",
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
        totalCount: memory.conversationHistory.length,
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getLumiInfo(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        lumiAIUrl: this.lumiService.getLumiAIUrl(),
        status: "independent",
        architecture: "standalone",
        message: "Lumi AI agora é independente e roda na porta 5000",
        endpoints: {
          chat: "/api/chat",
          analytics: "/api/analytics",
          health: "/health",
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
