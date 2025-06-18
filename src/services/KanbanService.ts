import { AppDataSource } from "../data-source";
import { KanbanBoard } from "../entities/KanbanBoard";
import { KanbanColumn } from "../entities/KanbanColumn";
import { Task } from "../entities/Task";
import { Goal } from "../entities/Goal";
import { User } from "../entities/User";
import { Not } from "typeorm";
import { logger } from "../utils/logger";

export class KanbanService {
  private kanbanBoardRepository = AppDataSource.getRepository(KanbanBoard);
  private kanbanColumnRepository = AppDataSource.getRepository(KanbanColumn);
  private taskRepository = AppDataSource.getRepository(Task);
  private goalRepository = AppDataSource.getRepository(Goal);
  private userRepository = AppDataSource.getRepository(User);

  async createBoardForGoal(goalId: string, userId: string): Promise<KanbanBoard> {
    try {
      const goal = await this.goalRepository.findOne({
        where: { id: goalId, user: { id: userId } },
        relations: ["user"],
      });

      if (!goal) {
        throw new Error("Meta não encontrada");
      }

      // Verificar se já existe um quadro para esta meta
      const existingBoard = await this.kanbanBoardRepository.findOne({
        where: { goal: { id: goalId } },
        relations: ["columns"],
      });

      if (existingBoard) {
        return existingBoard;
      }

      // Criar o quadro Kanban
      const board = this.kanbanBoardRepository.create({
        name: `Quadro - ${goal.title}`,
        description: `Quadro Kanban para a meta: ${goal.title}`,
        goal,
        user: goal.user,
        isActive: true,
      });

      const savedBoard = await this.kanbanBoardRepository.save(board);

      // Criar colunas padrão
      const defaultColumns = [
        { name: "A Fazer", position: 1, color: "#e3f2fd" },
        { name: "Em Andamento", position: 2, color: "#fff3e0" },
        { name: "Concluído", position: 3, color: "#f3e5f5" },
      ];

      const columns = [];
      for (const columnData of defaultColumns) {
        const column = this.kanbanColumnRepository.create({
          ...columnData,
          board: savedBoard,
          isActive: true,
        });
        columns.push(await this.kanbanColumnRepository.save(column));
      }

      savedBoard.columns = columns;

      logger.info(`Quadro Kanban criado para meta ${goalId}`, "KANBAN");
      return savedBoard;
    } catch (error) {
      logger.error("Erro ao criar quadro Kanban para meta", "KANBAN", error);
      throw error;
    }
  }

  async getBoardByGoal(goalId: string, userId: string): Promise<KanbanBoard | null> {
    try {
      return await this.kanbanBoardRepository.findOne({
        where: { 
          goal: { id: goalId },
          user: { id: userId }
        },
        relations: ["columns", "columns.tasks", "goal"],
        order: {
          columns: {
            position: "ASC",
            tasks: {
              position: "ASC",
            },
          },
        },
      });
    } catch (error) {
      logger.error("Erro ao buscar quadro Kanban por meta", "KANBAN", error);
      throw error;
    }
  }

  async getUserBoards(userId: string): Promise<KanbanBoard[]> {
    try {
      return await this.kanbanBoardRepository.find({
        where: { user: { id: userId }, isActive: true },
        relations: ["columns", "goal"],
        order: {
          createdAt: "DESC",
          columns: {
            position: "ASC",
          },
        },
      });
    } catch (error) {
      logger.error("Erro ao buscar quadros do usuário", "KANBAN", error);
      throw error;
    }
  }

  async getBoardById(boardId: string, userId: string): Promise<KanbanBoard | null> {
    try {
      return await this.kanbanBoardRepository.findOne({
        where: { 
          id: boardId,
          user: { id: userId },
          isActive: true
        },
        relations: ["columns", "columns.tasks", "goal"],
        order: {
          columns: {
            position: "ASC",
            tasks: {
              position: "ASC",
            },
          },
        },
      });
    } catch (error) {
      logger.error("Erro ao buscar quadro Kanban por ID", "KANBAN", error);
      throw error;
    }
  }

  async updateBoard(boardId: string, userId: string, updateData: Partial<KanbanBoard>): Promise<KanbanBoard> {
    try {
      const board = await this.kanbanBoardRepository.findOne({
        where: { id: boardId, user: { id: userId } },
        relations: ["columns"],
      });

      if (!board) {
        throw new Error("Quadro não encontrado");
      }

      Object.assign(board, updateData);
      const updatedBoard = await this.kanbanBoardRepository.save(board);

      logger.info(`Quadro ${boardId} atualizado`, "KANBAN");
      return updatedBoard;
    } catch (error) {
      logger.error("Erro ao atualizar quadro", "KANBAN", error);
      throw error;
    }
  }

  async deleteBoard(boardId: string, userId: string): Promise<void> {
    try {
      const board = await this.kanbanBoardRepository.findOne({
        where: { id: boardId, user: { id: userId } },
      });

      if (!board) {
        throw new Error("Quadro não encontrado");
      }

      // Soft delete - marca como inativo
      board.isActive = false;
      await this.kanbanBoardRepository.save(board);

      logger.info(`Quadro ${boardId} removido`, "KANBAN");
    } catch (error) {
      logger.error("Erro ao remover quadro", "KANBAN", error);
      throw error;
    }
  }

  async createColumn(boardId: string, userId: string, columnData: Partial<KanbanColumn>): Promise<KanbanColumn> {
    try {
      const board = await this.kanbanBoardRepository.findOne({
        where: { id: boardId, user: { id: userId } },
        relations: ["columns"],
      });

      if (!board) {
        throw new Error("Quadro não encontrado");
      }

      // Definir posição automaticamente se não fornecida
      if (!columnData.position) {
        const maxPosition = Math.max(...board.columns.map(c => c.position), 0);
        columnData.position = maxPosition + 1;
      }

      const column = this.kanbanColumnRepository.create({
        ...columnData,
        board,
        isActive: true,
      });

      const savedColumn = await this.kanbanColumnRepository.save(column);

      logger.info(`Coluna criada no quadro ${boardId}`, "KANBAN");
      return savedColumn;
    } catch (error) {
      logger.error("Erro ao criar coluna", "KANBAN", error);
      throw error;
    }
  }

  async updateColumn(columnId: string, userId: string, updateData: Partial<KanbanColumn>): Promise<KanbanColumn> {
    try {
      const column = await this.kanbanColumnRepository.findOne({
        where: { id: columnId, board: { user: { id: userId } } },
        relations: ["board"],
      });

      if (!column) {
        throw new Error("Coluna não encontrada");
      }

      Object.assign(column, updateData);
      const updatedColumn = await this.kanbanColumnRepository.save(column);

      logger.info(`Coluna ${columnId} atualizada`, "KANBAN");
      return updatedColumn;
    } catch (error) {
      logger.error("Erro ao atualizar coluna", "KANBAN", error);
      throw error;
    }
  }

  async deleteColumn(columnId: string, userId: string): Promise<void> {
    try {
      const column = await this.kanbanColumnRepository.findOne({
        where: { id: columnId, board: { user: { id: userId } } },
        relations: ["board", "tasks"],
      });

      if (!column) {
        throw new Error("Coluna não encontrada");
      }

      // Mover tarefas para a primeira coluna do quadro
      if (column.tasks && column.tasks.length > 0) {
        const firstColumn = await this.kanbanColumnRepository.findOne({
          where: { 
            board: { id: column.board.id },
            isActive: true,
            id: Not(columnId)
          },
          order: { position: "ASC" },
        });

        if (firstColumn) {
          for (const task of column.tasks) {
            task.kanbanColumn = firstColumn;
            await this.taskRepository.save(task);
          }
        }
      }

      // Soft delete - marca como inativo
      column.isActive = false;
      await this.kanbanColumnRepository.save(column);

      logger.info(`Coluna ${columnId} removida`, "KANBAN");
    } catch (error) {
      logger.error("Erro ao remover coluna", "KANBAN", error);
      throw error;
    }
  }

  async moveTask(taskId: string, columnId: string, position: number, userId: string): Promise<Task> {
    try {
      const task = await this.taskRepository.findOne({
        where: { id: taskId, user: { id: userId } },
        relations: ["kanbanColumn"],
      });

      if (!task) {
        throw new Error("Tarefa não encontrada");
      }

      const column = await this.kanbanColumnRepository.findOne({
        where: { id: columnId, board: { user: { id: userId } } },
        relations: ["board"],
      });

      if (!column) {
        throw new Error("Coluna não encontrada");
      }

      task.kanbanColumn = column;
      task.position = position;

      const updatedTask = await this.taskRepository.save(task);

      logger.info(`Tarefa ${taskId} movida para coluna ${columnId}`, "KANBAN");
      return updatedTask;
    } catch (error) {
      logger.error("Erro ao mover tarefa", "KANBAN", error);
      throw error;
    }
  }

  async reorderColumns(boardId: string, userId: string, columnOrder: { id: string; position: number }[]): Promise<void> {
    try {
      const board = await this.kanbanBoardRepository.findOne({
        where: { id: boardId, user: { id: userId } },
        relations: ["columns"],
      });

      if (!board) {
        throw new Error("Quadro não encontrado");
      }

      for (const { id, position } of columnOrder) {
        await this.kanbanColumnRepository.update(
          { id, board: { id: boardId } },
          { position }
        );
      }

      logger.info(`Colunas do quadro ${boardId} reordenadas`, "KANBAN");
    } catch (error) {
      logger.error("Erro ao reordenar colunas", "KANBAN", error);
      throw error;
    }
  }

  async createStandaloneBoard(
    name: string,
    description: string | undefined,
    userId: string
  ): Promise<KanbanBoard> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      // Criar o quadro Kanban sem meta associada
      const board = this.kanbanBoardRepository.create({
        name,
        description: description || `Quadro Kanban - ${name}`,
        user,
        isActive: true,
        // goal não é definido (null/undefined)
      });

      const savedBoard = await this.kanbanBoardRepository.save(board);

      // Criar colunas padrão
      const defaultColumns = [
        { name: "A Fazer", position: 1, color: "#e3f2fd" },
        { name: "Em Andamento", position: 2, color: "#fff3e0" },
        { name: "Concluído", position: 3, color: "#f3e5f5" },
      ];

      const columns = [];
      for (const columnData of defaultColumns) {
        const column = this.kanbanColumnRepository.create({
          ...columnData,
          board: savedBoard,
          isActive: true,
        });
        columns.push(await this.kanbanColumnRepository.save(column));
      }

      savedBoard.columns = columns;

      logger.info(`Quadro Kanban independente criado: ${name}`, "KANBAN");
      return savedBoard;
    } catch (error) {
      logger.error("Erro ao criar quadro Kanban independente", "KANBAN", error);
      throw error;
    }
  }
}
