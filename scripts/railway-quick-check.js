#!/usr/bin/env node

console.log('🔍 RAILWAY QUICK DIAGNOSIS - "Waiting for build to start"');
console.log('================================================\n');

// Verificar se está tudo nos lugares corretos
const fs = require('fs');

console.log('✅ VERIFICAÇÕES CRÍTICAS:');

// 1. railway.json
if (fs.existsSync('railway.json')) {
  const railway = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
  if (railway.build && railway.deploy) {
    console.log('✅ railway.json: Configurado corretamente');
  } else {
    console.log('❌ railway.json: Configuração incompleta');
  }
} else {
  console.log('❌ railway.json: Não encontrado');
}

// 2. package.json scripts
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (pkg.scripts.start && pkg.scripts.build) {
  console.log('✅ package.json: Scripts start e build OK');
} else {
  console.log('❌ package.json: Scripts ausentes');
}

// 3. Dist directory
if (fs.existsSync('dist/server.js')) {
  console.log('✅ Build: dist/server.js existe');
} else {
  console.log('⚠️  Build: Execute npm run build localmente');
}

console.log('\n🚀 AÇÕES PARA RAILWAY:');
console.log('1. Aguarde 2-3 minutos após o commit');
console.log('2. Se não funcionar, vá ao Railway:');
console.log('   - Settings → Danger → Clear Build Cache');
console.log('   - Force um redeploy manual');
console.log('3. Última opção: Delete e recrie o serviço');

console.log('\n📊 CONFIGURAÇÃO ATUAL:');
console.log(`- Node.js: ${pkg.engines?.node || 'não especificado'}`);
console.log(`- Start: ${pkg.scripts.start}`);
console.log(`- Build: ${pkg.scripts.build}`);

console.log('\n⏱️  Aguarde alguns minutos e verifique o Railway Dashboard...');
