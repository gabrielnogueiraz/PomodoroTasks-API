#!/usr/bin/env node

console.log('🔍 Verificando configuração para Railway Deploy...\n');

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'railway.json', 
  'nixpacks.toml',
  '.nvmrc',
  'src/server.ts',
  'tsconfig.json'
];

const checkFile = (filename) => {
  const exists = fs.existsSync(filename);
  console.log(`${exists ? '✅' : '❌'} ${filename}`);
  return exists;
};

console.log('📁 Verificando arquivos necessários:');
const allFilesExist = requiredFiles.every(checkFile);

console.log('\n📦 Verificando package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  console.log(`${pkg.scripts?.start ? '✅' : '❌'} Script "start" definido`);
  console.log(`${pkg.scripts?.build ? '✅' : '❌'} Script "build" definido`);
  console.log(`${pkg.engines?.node ? '✅' : '❌'} Versão do Node.js especificada`);
  console.log(`${pkg.main ? '✅' : '❌'} Entry point definido: ${pkg.main}`);
  
} catch (error) {
  console.log('❌ Erro ao ler package.json');
}

console.log('\n🔧 Verificando railway.json:');
try {
  const railway = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
  console.log(`${railway.deploy?.startCommand ? '✅' : '❌'} Start command definido`);
  console.log(`${railway.deploy?.healthcheckPath ? '✅' : '❌'} Health check configurado`);
} catch (error) {
  console.log('❌ Erro ao ler railway.json');
}

console.log('\n🏗️ Testando build local:');
console.log('Execute: npm run build');
console.log('Depois: npm start');

console.log(`\n${allFilesExist ? '🎉' : '⚠️'} Status: ${allFilesExist ? 'Pronto para deploy!' : 'Corrija os problemas acima'}`);

if (allFilesExist) {
  console.log('\n🚀 Próximos passos:');
  console.log('1. git add . && git commit -m "Add Railway config" && git push');
  console.log('2. No Railway: Force new deployment ou faça novo commit');
  console.log('3. Configure as variáveis de ambiente necessárias');
}
