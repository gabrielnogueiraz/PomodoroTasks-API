import { AppDataSource } from "../src/data-source";
import { User } from "../src/entities/User";
import { StreakService } from "../src/services/StreakService";
import { AnalyticsService } from "../src/services/AnalyticsService";

export async function initializeNewFeatures(): Promise<void> {
  try {
    console.log("🚀 Inicializando novas funcionalidades...");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const streakService = new StreakService();
    const analyticsService = new AnalyticsService();
    const userRepository = AppDataSource.getRepository(User);

    const users = await userRepository.find();
    
    console.log(`📊 Inicializando dados para ${users.length} usuários...`);

    for (const user of users) {
      try {
        await streakService.initializeUserStreak(user.id);
        await analyticsService.updateDailyPerformance(user.id, new Date());
        
        console.log(`✅ Dados inicializados para usuário: ${user.name}`);
      } catch (error) {
        console.error(`❌ Erro ao inicializar dados para usuário ${user.name}:`, error);
      }
    }

    console.log("🎉 Inicialização das novas funcionalidades concluída!");
  } catch (error) {
    console.error("❌ Erro na inicialização das novas funcionalidades:", error);
    throw error;
  }
}

if (require.main === module) {
  initializeNewFeatures()
    .then(() => {
      console.log("✨ Script executado com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Falha na execução do script:", error);
      process.exit(1);
    });
}
