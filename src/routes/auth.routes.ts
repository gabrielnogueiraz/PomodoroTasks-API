import { Router, Request, Response } from "express";
import { UserController } from "../controllers/UserController";

const authRoutes = Router();
const userController = new UserController();

authRoutes.post("/register", (req: Request, res: Response) =>
  userController.register(req, res)
);

authRoutes.post("/login", (req: Request, res: Response) =>
  userController.login(req, res)
);

export { authRoutes }; 