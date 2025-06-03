import { Request, Response } from "express";
import { FlowerService } from "../services/FlowerService";

export class FlowerController {
  private flowerService: FlowerService;

  constructor() {
    this.flowerService = new FlowerService();
  }

  async getUserFlowers(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const flowers = await this.flowerService.getUserFlowers(userId);
    res.json(flowers);
  }
  async getUserGarden(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const garden = await this.flowerService.getUserGarden(userId);
    res.json(garden);
  }

  async getGardenStats(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const stats = await this.flowerService.getGardenStats(userId);
    res.json(stats);
  }  async createFlowerForPomodoro(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }
    
    res.status(410).json({ 
      message: "Este endpoint foi removido. As flores são criadas automaticamente ao completar pomodoros.",
      suggestion: "Use POST /api/pomodoros/:id/complete para completar um pomodoro"
    });
  }

  async checkRareFlower(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { color } = req.query;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    if (!color) {
      res.status(400).json({ message: "Cor da flor é obrigatória" });
      return;
    }

    const isRare = await this.flowerService.checkForRareFlower(
      userId,
      color as any
    );

    res.json({ isRare });
  }
}
