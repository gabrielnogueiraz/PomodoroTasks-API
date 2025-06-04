import { Router, Request, Response } from "express";
import { FlowerController } from "../controllers/FlowerController";
import { authMiddleware } from "../middleware/auth";

const flowerRoutes = Router();
const flowerController = new FlowerController();

flowerRoutes.use(authMiddleware);

flowerRoutes.get("/", (req: Request, res: Response) =>
  flowerController.getUserFlowers(req, res)
);

flowerRoutes.get("/garden", (req: Request, res: Response) =>
  flowerController.getUserGarden(req, res)
);

flowerRoutes.get("/stats", (req: Request, res: Response) =>
  flowerController.getGardenStats(req, res)
);

flowerRoutes.get("/check-rare", (req: Request, res: Response) =>
  flowerController.checkRareFlower(req, res)
);

export { flowerRoutes };
