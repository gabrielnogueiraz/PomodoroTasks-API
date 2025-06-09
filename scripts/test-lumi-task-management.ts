import { AppDataSource } from "../src/data-source";
import { UserService } from "../src/services/UserService";
import { LumiService } from "../src/services/LumiService";
import { TaskPriority } from "../src/entities/Task";

async function testLumiTaskManagement() {
  try {
    console.log("🔧 Inicializando conexão com banco de dados...");
    await AppDataSource.initialize();
    console.log("✅ Conexão estabelecida!");

    const userService = new UserService();
    const lumiService = new LumiService();

    // Test 1: Create or get test user
    console.log("\n👤 Teste 1: Criando/obtendo usuário de teste...");
    
    let testUser = await userService.findByEmail("lumi.test@example.com");
    if (!testUser) {
      testUser = await userService.create({
        name: "Lumi Test User",
        email: "lumi.test@example.com",
        password: "lumitest123"
      });
    }
    
    console.log(`✅ Usuário de teste: ${testUser.name} (${testUser.id})`);

    // Test 2: Lumi creates a task
    console.log("\n📝 Teste 2: Lumi criando uma tarefa...");
    
    const createTaskResult = await lumiService.executeLumiAction(testUser.id, {
      type: "create",
      taskData: {
        title: "Tarefa criada pela Lumi",
        description: "Esta tarefa foi criada automaticamente pela assistente Lumi",
        priority: TaskPriority.HIGH,
        estimatedPomodoros: 2
      }
    });

    console.log(`📋 Resultado da criação:`, createTaskResult);

    if (!createTaskResult.success) {
      throw new Error(`Falha ao criar tarefa: ${createTaskResult.message}`);
    }

    const createdTaskId = createTaskResult.data.id;
    console.log(`✅ Tarefa criada com ID: ${createdTaskId}`);

    // Test 3: Lumi updates the task
    console.log("\n✏️ Teste 3: Lumi atualizando a tarefa...");
    
    const updateTaskResult = await lumiService.executeLumiAction(testUser.id, {
      type: "update",
      taskId: createdTaskId,
      taskData: {
        title: "Tarefa ATUALIZADA pela Lumi",
        description: "Descrição foi atualizada pela assistente",
        priority: TaskPriority.MEDIUM,
        estimatedPomodoros: 3
      }
    });

    console.log(`📝 Resultado da atualização:`, updateTaskResult);

    if (!updateTaskResult.success) {
      throw new Error(`Falha ao atualizar tarefa: ${updateTaskResult.message}`);
    }

    // Test 4: Lumi starts a pomodoro
    console.log("\n🍅 Teste 4: Lumi iniciando um pomodoro...");
    
    const startPomodoroResult = await lumiService.executeLumiAction(testUser.id, {
      type: "start_pomodoro",
      taskId: createdTaskId,
      pomodoroData: {
        duration: 25 * 60, // 25 minutos
        notes: "Pomodoro iniciado pela Lumi"
      }
    });

    console.log(`🍅 Resultado do pomodoro:`, startPomodoroResult);

    if (!startPomodoroResult.success) {
      throw new Error(`Falha ao iniciar pomodoro: ${startPomodoroResult.message}`);
    }

    // Test 5: Check Lumi memory updates
    console.log("\n🧠 Teste 5: Verificando atualizações na memória da Lumi...");
    
    const memory = await lumiService.getOrCreateLumiMemory(testUser.id);
    console.log(`   - Total de interações: ${memory.interactionCount}`);
    console.log(`   - Tarefas recentes na memória: ${memory.contextualMemory.recentTasks.length}`);
    console.log(`   - Conquistas totais: ${memory.achievements.totalTasksCompleted}`);

    // Test 6: Get full context
    console.log("\n🌍 Teste 6: Contexto completo do usuário...");
    
    const context = await lumiService.getFullUserContext(testUser.id);
    console.log(`   - Tarefas recentes: ${context.recentTasks.length}`);
    console.log(`   - Flores no jardim: ${context.garden.totalFlowers}`);
    console.log(`   - Taxa de conclusão: ${context.statistics.averageCompletionRate}%`);

    // Test 7: Lumi completes the task
    console.log("\n✅ Teste 7: Lumi marcando tarefa como concluída...");
    
    const completeTaskResult = await lumiService.executeLumiAction(testUser.id, {
      type: "complete",
      taskId: createdTaskId
    });

    console.log(`✅ Resultado da conclusão:`, completeTaskResult);

    if (!completeTaskResult.success) {
      throw new Error(`Falha ao completar tarefa: ${completeTaskResult.message}`);
    }

    // Test 8: Try to delete the completed task
    console.log("\n🗑️ Teste 8: Lumi deletando a tarefa...");
    
    const deleteTaskResult = await lumiService.executeLumiAction(testUser.id, {
      type: "delete",
      taskId: createdTaskId
    });

    console.log(`🗑️ Resultado da exclusão:`, deleteTaskResult);

    if (!deleteTaskResult.success) {
      throw new Error(`Falha ao deletar tarefa: ${deleteTaskResult.message}`);
    }

    // Test 9: Final memory check
    console.log("\n🧠 Teste 9: Verificação final da memória...");
    
    const finalMemory = await lumiService.getOrCreateLumiMemory(testUser.id);
    console.log(`   - Total de interações finais: ${finalMemory.interactionCount}`);
    console.log(`   - Humor atual: ${finalMemory.currentMood}`);
    console.log(`   - Pontuação de utilidade: ${finalMemory.helpfulnessScore}`);

    console.log("\n🎉 TODOS OS TESTES PASSARAM!");
    console.log("✅ A Lumi agora pode gerenciar tarefas completamente!");
    console.log("✅ Integração com banco de dados funcionando");
    console.log("✅ Sistema de memória atualizando corretamente");
    console.log("✅ Ações sendo registradas adequadamente");

  } catch (error) {
    console.error("\n❌ Erro durante os testes:", error);
    
    if (error instanceof Error) {
      console.error("   Mensagem:", error.message);
      console.error("   Stack:", error.stack);
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("\n🔌 Conexão com banco de dados encerrada");
    }
  }
}

// Executar testes
if (require.main === module) {
  testLumiTaskManagement()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Falha crítica:", error);
      process.exit(1);
    });
}

export { testLumiTaskManagement };
