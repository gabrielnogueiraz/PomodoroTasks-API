import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  name: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "Token não fornecido" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  if (!token || token === "Bearer") {
    res.status(401).json({ message: "Token inválido" });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET não configurado");
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expirado" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Token inválido" });
    } else {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
};
