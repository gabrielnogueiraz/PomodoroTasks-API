import { Request, Response } from "express";
import { KanbanService } from "../services/KanbanService";
import { logger } from "../utils/logger";

export class KanbanController {
  private kanbanService = new KanbanService();
  // Criar quadro para uma meta
  createBoardForGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { goalId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const board = await this.kanbanService.createBoardForGoal(goalId, userId);
      
      res.status(201).json({
        message: "Quadro Kanban criado com sucesso",
        board,
      });
    } catch (error) {
      logger.error("Erro ao criar quadro Kanban", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };  // Buscar quadro por meta
  getBoardByGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { goalId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const board = await this.kanbanService.getBoardByGoal(goalId, userId);
      
      if (!board) {
        res.status(404).json({ error: "Quadro não encontrado" });
        return;
      }

      res.json({
        message: "Quadro encontrado",
        board,
      });
    } catch (error) {
      logger.error("Erro ao buscar quadro por meta", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Listar quadros do usuário
  getUserBoards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const boards = await this.kanbanService.getUserBoards(userId);
      
      res.json({
        message: "Quadros encontrados",
        boards,
      });
    } catch (error) {
      logger.error("Erro ao buscar quadros do usuário", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Atualizar quadro
  updateBoard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { boardId } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const board = await this.kanbanService.updateBoard(boardId, userId, updateData);
      
      res.json({
        message: "Quadro atualizado com sucesso",
        board,
      });
    } catch (error) {
      logger.error("Erro ao atualizar quadro", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Remover quadro
  deleteBoard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { boardId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await this.kanbanService.deleteBoard(boardId, userId);
      
      res.json({
        message: "Quadro removido com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao remover quadro", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Criar coluna
  createColumn = async (req: Request, res: Response): Promise<void> => {
    try {
      const { boardId } = req.params;
      const userId = req.user?.id;
      const columnData = req.body;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const column = await this.kanbanService.createColumn(boardId, userId, columnData);
      
      res.status(201).json({
        message: "Coluna criada com sucesso",
        column,
      });
    } catch (error) {
      logger.error("Erro ao criar coluna", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Atualizar coluna
  updateColumn = async (req: Request, res: Response): Promise<void> => {
    try {
      const { columnId } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const column = await this.kanbanService.updateColumn(columnId, userId, updateData);
      
      res.json({
        message: "Coluna atualizada com sucesso",
        column,
      });
    } catch (error) {
      logger.error("Erro ao atualizar coluna", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Remover coluna
  deleteColumn = async (req: Request, res: Response): Promise<void> => {
    try {
      const { columnId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await this.kanbanService.deleteColumn(columnId, userId);
      
      res.json({
        message: "Coluna removida com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao remover coluna", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Mover tarefa
  moveTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { columnId, position } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const task = await this.kanbanService.moveTask(taskId, columnId, position, userId);
      
      res.json({
        message: "Tarefa movida com sucesso",
        task,
      });
    } catch (error) {
      logger.error("Erro ao mover tarefa", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
  // Reordenar colunas
  reorderColumns = async (req: Request, res: Response): Promise<void> => {
    try {
      const { boardId } = req.params;
      const { columnOrder } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await this.kanbanService.reorderColumns(boardId, userId, columnOrder);
      
      res.json({
        message: "Colunas reordenadas com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao reordenar colunas", "KANBAN_CONTROLLER", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      });
    }
  };
}
