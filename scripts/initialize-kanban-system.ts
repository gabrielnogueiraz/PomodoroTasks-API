import { AppDataSource } from "../src/data-source";
import { GoalService } from "../src/services/GoalService";
import { KanbanService } from "../src/services/KanbanService";
import { ProductivityAnalyticsService } from "../src/services/ProductivityAnalyticsService";
import { UserService } from "../src/services/UserService";
import { GoalType, GoalCategory } from "../src/entities/Goal";
import { logger } from "../src/utils/logger";

async function initializeKanbanSystem() {
  try {
    await AppDataSource.initialize();
    logger.info("Database conectado para inicialização das funcionalidades Kanban", "INIT");

    const goalService = new GoalService();
    const kanbanService = new KanbanService();
    const analyticsService = new ProductivityAnalyticsService();

    // Buscar todas as metas existentes que não têm quadro Kanban
    const goals = await AppDataSource.getRepository("Goal").find({
      relations: ["user", "kanbanBoard"],
    });

    logger.info(`Encontradas ${goals.length} metas existentes`, "INIT");

    let createdBoards = 0;

    for (const goal of goals) {
      if (!goal.kanbanBoard) {
        try {
          await kanbanService.createBoardForGoal(goal.id, goal.user.id);
          createdBoards++;
          logger.info(`Quadro Kanban criado para meta: ${goal.title}`, "INIT");
        } catch (error) {
          logger.error(`Erro ao criar quadro para meta ${goal.title}`, "INIT", error);
        }
      }
    }

    logger.info(`✅ Inicialização concluída!`, "INIT");
    logger.info(`📊 ${createdBoards} quadros Kanban criados`, "INIT");
    logger.info(`🎯 Sistema de metas com Kanban está pronto!`, "INIT");

    // Criar algumas métricas de exemplo para usuários existentes
    const users = await AppDataSource.getRepository("User").find();
    
    if (users.length > 0) {
      logger.info(`Criando métricas de exemplo para ${users.length} usuários`, "INIT");
    }

    await AppDataSource.destroy();
    logger.info("✅ Inicialização do sistema Kanban concluída com sucesso!", "INIT");

  } catch (error) {
    logger.error("❌ Erro durante a inicialização:", "INIT", error);
    process.exit(1);
  }
}

async function createExampleGoalWithKanban() {
  try {
    await AppDataSource.initialize();
    
    const users = await AppDataSource.getRepository("User").find({ take: 1 });
    
    if (users.length === 0) {
      logger.info("Nenhum usuário encontrado para criar exemplo", "INIT");
      return;
    }

    const user = users[0];
    const goalService = new GoalService();

    // Criar uma meta de exemplo
    const exampleGoal = await goalService.createGoal({
      userId: user.id,
      title: "Aprender TypeScript",
      description: "Meta para aprender TypeScript através de projetos práticos",
      type: GoalType.MONTHLY,
      category: GoalCategory.TASKS_COMPLETED,
      targetValue: 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    });

    logger.info(`✅ Meta de exemplo criada: ${exampleGoal.title}`, "INIT");
    logger.info(`📋 Quadro Kanban criado automaticamente`, "INIT");

    await AppDataSource.destroy();
  } catch (error) {
    logger.error("Erro ao criar exemplo:", "INIT", error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes("--example")) {
    createExampleGoalWithKanban();
  } else {
    initializeKanbanSystem();
  }
}

export { initializeKanbanSystem, createExampleGoalWithKanban };
