import { Router, Request, Response } from "express";
import { LumiController } from "../controllers/LumiController";
import { authMiddleware } from "../middleware/auth";

const lumiRoutes = Router();
const lumiController = new LumiController();

lumiRoutes.use(authMiddleware);

lumiRoutes.post("/chat", (req: Request, res: Response) =>
  lumiController.chat(req, res)
);

lumiRoutes.get("/memory", (req: Request, res: Response) =>
  lumiController.getUserMemory(req, res)
);

lumiRoutes.get("/context", (req: Request, res: Response) =>
  lumiController.getUserContext(req, res)
);

lumiRoutes.patch("/personality", (req: Request, res: Response) =>
  lumiController.updatePersonality(req, res)
);

lumiRoutes.get("/history", (req: Request, res: Response) =>
  lumiController.getConversationHistory(req, res)
);

lumiRoutes.get("/info", (req: Request, res: Response) =>
  lumiController.getLumiInfo(req, res)
);

export { lumiRoutes };
