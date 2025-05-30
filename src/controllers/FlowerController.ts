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
  }
  async createFlowerForPomodoro(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { taskId } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    if (!taskId) {
      res.status(400).json({ message: "ID da tarefa é obrigatório" });
      return;
    }

    const flower = await this.flowerService.createFlowerForPomodoroCompletion(
      userId,
      taskId
    );

    if (!flower) {
      res.status(404).json({ message: "Tarefa não encontrada ou não pertence ao usuário" });
      return;
    }

    res.status(201).json({
      message: "Flor criada com sucesso!",
      flower,
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
