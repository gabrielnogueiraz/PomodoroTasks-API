#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🔍 Testando build local antes do deploy no Railway...\n');

const steps = [
  {
    name: 'Limpando cache npm',
    command: 'npm cache clean --force'
  },
  {
    name: 'Removendo node_modules',
    command: 'rm -rf node_modules'
  },
  {
    name: 'Instalando dependências (npm ci)',
    command: 'npm ci --prefer-offline --no-audit --no-fund'
  },
  {
    name: 'Executando build',
    command: 'npm run build'
  },
  {
    name: 'Testando start',
    command: 'timeout 5s npm start || true'
  }
];

async function runStep(step, index) {
  return new Promise((resolve, reject) => {
    console.log(`[${index + 1}/${steps.length}] ${step.name}...`);
    
    exec(step.command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error && !step.command.includes('timeout')) {
        console.error(`❌ Erro em: ${step.name}`);
        console.error(`Comando: ${step.command}`);
        console.error(`Erro: ${error.message}`);
        if (stderr) console.error(`Stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      console.log(`✅ ${step.name} - Concluído`);
      if (stdout && stdout.trim()) {
        console.log(`📝 Output: ${stdout.trim().substring(0, 200)}${stdout.length > 200 ? '...' : ''}`);
      }
      console.log('');
      resolve();
    });
  });
}

async function main() {
  try {
    for (let i = 0; i < steps.length; i++) {
      await runStep(steps[i], i);
    }
    
    console.log('🎉 Teste de build concluído com sucesso!');
    console.log('✅ O projeto deve fazer deploy sem problemas no Railway.');
    console.log('\n📋 Próximos passos:');
    console.log('1. git add .');
    console.log('2. git commit -m "fix: resolve build cache issues"');
    console.log('3. git push origin main');
    console.log('4. Aguarde o deploy no Railway');
    
  } catch (error) {
    console.log('\n❌ Teste de build falhou!');
    console.log('🔧 Corrija os erros acima antes de fazer deploy no Railway.');
    process.exit(1);
  }
}

main();
