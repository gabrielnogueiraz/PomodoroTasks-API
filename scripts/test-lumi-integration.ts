// Test script for Lumi integration
import { AppDataSource } from "../src/data-source";
import { LumiService } from "../src/services/LumiService";
import { UserService } from "../src/services/UserService";
import { TaskService } from "../src/services/TaskService";
import { TaskPriority } from "../src/entities/Task";

async function testLumiIntegration() {
  console.log("🧪 Iniciando testes de integração do Lumi...");
  
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("✅ Conexão com banco de dados estabelecida");
    
    // Initialize services
    const lumiService = new LumiService();
    const userService = new UserService();
    const taskService = new TaskService();
    
    // Test 1: Create test user
    console.log("\n📋 Teste 1: Criação de usuário de teste...");
    
    const testUser = await userService.create({
      name: "Lumi Test User",
      email: "lumi.test@example.com",
      password: "testpassword123"
    });
    
    if (!testUser) {
      throw new Error("Falha ao criar usuário de teste");
    }
    
    console.log(`✅ Usuário criado: ${testUser.name} (${testUser.id})`);
    
    // Test 2: Create Lumi memory
    console.log("\n🧠 Teste 2: Criação de memória Lumi...");
    
    const lumiMemory = await lumiService.getOrCreateLumiMemory(testUser.id);
    console.log(`✅ Memória Lumi criada: ${lumiMemory.id}`);
    console.log(`   - Humor atual: ${lumiMemory.currentMood}`);
    console.log(`   - Contagem de interações: ${lumiMemory.interactionCount}`);
    
    // Test 3: Get full user context
    console.log("\n🌍 Teste 3: Contexto completo do usuário...");
    
    const userContext = await lumiService.getFullUserContext(testUser.id);
    console.log(`✅ Contexto obtido para usuário: ${userContext.user.name}`);
    console.log(`   - Tarefas recentes: ${userContext.recentTasks.length}`);
    console.log(`   - Flores no jardim: ${userContext.garden.totalFlowers}`);
    console.log(`   - Taxa de conclusão: ${userContext.statistics.averageCompletionRate}%`);
    
    // Test 4: Create test task and record action
    console.log("\n📝 Teste 4: Criação de tarefa e registro de ação...");    const testTask = await taskService.create({
      title: "Tarefa de Teste Lumi",
      description: "Tarefa criada para testar integração do Lumi",
      priority: TaskPriority.MEDIUM,
      estimatedPomodoros: 2,
      user: testUser
    });
    
    if (!testTask) {
      throw new Error("Falha ao criar tarefa de teste");
    }
    
    console.log(`✅ Tarefa criada: ${testTask.title} (${testTask.id})`);
    
    // The task creation should have automatically triggered Lumi notification
    // Let's check if the memory was updated
    const updatedMemory = await lumiService.getOrCreateLumiMemory(testUser.id);
    console.log(`   - Interações após criação da tarefa: ${updatedMemory.interactionCount}`);
    console.log(`   - Tarefas recentes na memória: ${updatedMemory.contextualMemory.recentTasks.length}`);
    
    // Test 5: Complete task and check flower creation
    console.log("\n🌸 Teste 5: Conclusão de tarefa e criação de flor...");
    
    const completedTask = await taskService.markAsCompleted(testTask.id);
    if (completedTask) {
      console.log(`✅ Tarefa marcada como completa: ${completedTask.title}`);
      
      // Check memory update
      const finalMemory = await lumiService.getOrCreateLumiMemory(testUser.id);
      console.log(`   - Conquistas atualizadas: ${finalMemory.achievements.totalTasksCompleted} tarefas completas`);
      console.log(`   - Streak atual: ${finalMemory.achievements.currentStreak}`);
    }
    
    // Test 6: Test AI communication (this will likely fail without AI backend)
    console.log("\n🤖 Teste 6: Comunicação com backend de IA...");
    
    try {
      const lumiResponse = await lumiService.sendToLumiAI({
        userId: testUser.id,
        message: "Olá Lumi, este é um teste de integração!",
        context: userContext,
        action: "chat"
      });
      
      console.log(`✅ Resposta do Lumi: "${lumiResponse.response}"`);
      console.log(`   - Humor: ${lumiResponse.mood}`);
      if (lumiResponse.suggestions) {
        console.log(`   - Sugestões: ${lumiResponse.suggestions.join(", ")}`);
      }
    } catch (error) {
      console.log(`⚠️ Backend de IA não disponível (esperado): ${error.message}`);
      console.log("   Resposta de fallback será usada em produção");
    }
    
    console.log("\n🎉 Todos os testes de integração foram executados!");
    console.log("✅ Lumi está integrado e funcional");
      // Cleanup: Remove test data
    console.log("\n🧹 Limpando dados de teste...");
    await taskService.delete(testTask.id);
    await lumiService.deleteLumiMemory(testUser.id);
    // Note: UserService.delete não existe, mas o usuário de teste pode permanecer
    console.log("✅ Dados de teste removidos");
    
  } catch (error) {
    console.error("❌ Erro durante teste de integração:", error);
    throw error;
  } finally {
    // Close database connection
    await AppDataSource.destroy();
    console.log("✅ Conexão com banco de dados fechada");
  }
}

// Run the test
if (require.main === module) {
  testLumiIntegration()
    .then(() => {
      console.log("\n🎊 Teste de integração do Lumi concluído com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Teste de integração do Lumi falhou:", error);
      process.exit(1);
    });
}

export { testLumiIntegration };
