#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Railway Database Setup Script');
console.log('================================');

// Verifica se estamos em produção no Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT_NAME || process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

if (!isRailway) {
  console.log('❌ Este script é apenas para Railway');
  process.exit(0);
}

console.log('✅ Detectado ambiente Railway');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Missing'}`);

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL não encontrada!');
  console.log('🔧 Adicione um serviço PostgreSQL no Railway');
  process.exit(1);
}

try {
  // Build do projeto se não estiver buildado
  if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
    console.log('🏗️  Building project...');
    execSync('npm run build', { stdio: 'inherit' });
  }

  // Executa o servidor com sync habilitado temporariamente
  console.log('🗄️  Configurando banco de dados...');
  console.log('⚠️  Habilitando sincronização temporária para criação das tabelas');
  
  // Define DB_SYNC=true temporariamente para este processo
  process.env.DB_SYNC = 'true';
  
  // Importa e executa a inicialização do banco
  const { initializeDatabase } = require('./dist/data-source.js');
  
  console.log('🔄 Inicializando conexão com banco...');
  initializeDatabase()
    .then(() => {
      console.log('✅ Banco de dados configurado com sucesso!');
      console.log('📋 Tabelas criadas:');
      console.log('   - user');
      console.log('   - task');
      console.log('   - pomodoro');
      console.log('   - flower');
      console.log('   - garden');
      console.log('   - lumi_memory');
      console.log('');
      console.log('🚀 Banco pronto para uso!');
      console.log('💡 Em próximos deploys, remova DB_SYNC=true das variáveis');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao configurar banco:', error.message);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('1. Verifique se PostgreSQL foi adicionado ao projeto Railway');
      console.log('2. Confirme que DATABASE_URL está configurada');
      console.log('3. Tente redeployar o projeto');
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Erro durante setup:', error.message);
  process.exit(1);
}
