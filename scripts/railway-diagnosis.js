#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO RAILWAY - Waiting for build to start...');
console.log('====================================================\n');

const issues = [];
const warnings = [];

// 1. Verificar arquivos essenciais
console.log('📁 Verificando arquivos essenciais...');

const essentialFiles = [
  'package.json',
  'railway.json', 
  '.nvmrc',
  'Procfile',
  'src/server.ts'
];

essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    issues.push(`Arquivo ausente: ${file}`);
  }
});

// 2. Verificar package.json
console.log('\n📦 Verificando package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (pkg.scripts && pkg.scripts.start) {
    console.log(`✅ Script start: ${pkg.scripts.start}`);
  } else {
    console.log('❌ Script start não encontrado');
    issues.push('Script "start" ausente no package.json');
  }
  
  if (pkg.scripts && pkg.scripts.build) {
    console.log(`✅ Script build: ${pkg.scripts.build}`);
  } else {
    console.log('❌ Script build não encontrado');
    issues.push('Script "build" ausente no package.json');
  }
  
  if (pkg.engines && pkg.engines.node) {
    console.log(`✅ Node engine: ${pkg.engines.node}`);
  } else {
    console.log('⚠️  Node engine não especificado');
    warnings.push('Especifique engines.node no package.json');
  }
  
} catch (error) {
  console.log('❌ Erro ao ler package.json');
  issues.push('package.json inválido ou ilegível');
}

// 3. Verificar .nvmrc
console.log('\n🏷️  Verificando .nvmrc...');
if (fs.existsSync('.nvmrc')) {
  const nvmrc = fs.readFileSync('.nvmrc', 'utf8').trim();
  console.log(`✅ Node version: ${nvmrc}`);
  
  if (!nvmrc.match(/^\d+\.\d+\.\d+$/)) {
    console.log('❌ Formato inválido de versão no .nvmrc');
    issues.push('Formato inválido no .nvmrc (use formato: 18.19.0)');
  }
}

// 4. Verificar railway.json
console.log('\n🚂 Verificando railway.json...');
try {
  const railway = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
  
  if (railway.deploy && railway.deploy.startCommand) {
    console.log(`✅ Start command: ${railway.deploy.startCommand}`);
  } else {
    console.log('⚠️  Start command não especificado');
    warnings.push('Especifique startCommand no railway.json');
  }
  
  if (railway.build) {
    console.log(`✅ Builder: ${railway.build.builder || 'default'}`);
  }
  
} catch (error) {
  console.log('❌ Erro ao ler railway.json');
  issues.push('railway.json inválido ou ilegível');
}

// 5. Verificar dist/ após build
console.log('\n🏗️  Verificando build...');
if (fs.existsSync('dist')) {
  console.log('✅ Pasta dist/ existe');
  if (fs.existsSync('dist/server.js')) {
    console.log('✅ dist/server.js existe');
  } else {
    console.log('❌ dist/server.js não encontrado');
    issues.push('Build não gerou dist/server.js');
  }
} else {
  console.log('⚠️  Pasta dist/ não existe (execute npm run build)');
  warnings.push('Execute npm run build para gerar dist/');
}

// 6. Verificar tamanho do repositório
console.log('\n📊 Verificando tamanho do projeto...');
try {
  const stats = fs.statSync('.');
  console.log('✅ Projeto acessível');
  
  if (fs.existsSync('node_modules')) {
    console.log('⚠️  node_modules presente (deve estar no .gitignore)');
    warnings.push('node_modules não deve ser commitado');
  }
  
} catch (error) {
  console.log('❌ Erro ao acessar projeto');
  issues.push('Problemas de acesso ao diretório do projeto');
}

// 7. Verificar .gitignore
console.log('\n🚫 Verificando .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const shouldIgnore = ['node_modules', 'dist', '.env', '*.log'];
  
  shouldIgnore.forEach(item => {
    if (gitignore.includes(item)) {
      console.log(`✅ Ignoring: ${item}`);
    } else {
      console.log(`⚠️  Not ignoring: ${item}`);
      warnings.push(`Adicione "${item}" ao .gitignore`);
    }
  });
}

// Relatório final
console.log('\n' + '='.repeat(50));
console.log('📋 RELATÓRIO FINAL');
console.log('='.repeat(50));

if (issues.length === 0) {
  console.log('✅ Nenhum problema crítico encontrado!');
} else {
  console.log(`❌ ${issues.length} problema(s) crítico(s) encontrado(s):`);
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} aviso(s):`);
  warnings.forEach((warning, i) => {
    console.log(`   ${i + 1}. ${warning}`);
  });
}

console.log('\n🔧 SOLUÇÕES SUGERIDAS:');
console.log('1. Force um commit vazio: git commit --allow-empty -m "force rebuild"');
console.log('2. Verifique se PostgreSQL foi adicionado ao projeto Railway');
console.log('3. Limpe cache do Railway: Settings → Danger → Clear Build Cache');
console.log('4. Delete e recrie o serviço se necessário');

if (issues.length > 0) {
  console.log('\n❌ Corrija os problemas críticos antes de tentar deploy novamente');
  process.exit(1);
} else {
  console.log('\n✅ Projeto parece estar configurado corretamente para Railway');
  process.exit(0);
}
