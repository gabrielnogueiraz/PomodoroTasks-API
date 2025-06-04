import { Router, Request, Response } from "express";
import { LumiController } from "../controllers/LumiController";
import { authMiddleware } from "../middleware/auth";

const lumiRoutes = Router();
const lumiController = new LumiController();

// Todas as rotas da Lumi precisam de autenticação
lumiRoutes.use(authMiddleware);

// Chat com a Lumi
lumiRoutes.post("/chat", (req: Request, res: Response) =>
  lumiController.chat(req, res)
);

// Obter memória do usuário
lumiRoutes.get("/memory", (req: Request, res: Response) =>
  lumiController.getUserMemory(req, res)
);

// Obter contexto completo do usuário
lumiRoutes.get("/context", (req: Request, res: Response) =>
  lumiController.getUserContext(req, res)
);

// Atualizar perfil de personalidade
lumiRoutes.patch("/personality", (req: Request, res: Response) =>
  lumiController.updatePersonality(req, res)
);

// Obter histórico de conversas
lumiRoutes.get("/history", (req: Request, res: Response) =>
  lumiController.getConversationHistory(req, res)
);

export { lumiRoutes };
