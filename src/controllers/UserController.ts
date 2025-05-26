import { Request, Response } from "express";
import { UserService } from "../services/UserService";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async register(req: Request, res: Response): Promise<void> {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      res.status(400).json({ message: "Todos os campos são obrigatórios" });
      return;
    }

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: "Email já está em uso" });
      return;
    }

    const user = await this.userService.create({ email, name, password });
    const token = this.userService.generateToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email e senha são obrigatórios" });
      return;
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      res.status(401).json({ message: "Credenciais inválidas" });
      return;
    }

    const isValidPassword = await this.userService.validatePassword(user, password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Credenciais inválidas" });
      return;
    }

    const token = this.userService.generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  }
} 