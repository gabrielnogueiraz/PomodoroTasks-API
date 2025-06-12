/**
 * Script de validação pré-deploy
 * Verifica se o projeto está 100% pronto para produção
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  category: string;
  check: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

class ProductionValidator {
  private results: ValidationResult[] = [];

  private addResult(category: string, check: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
    this.results.push({ category, check, status, message });
  }

  private fileExists(filePath: string): boolean {
    return fs.existsSync(path.join(process.cwd(), filePath));
  }

  private readFile(filePath: string): string {
    try {
      return fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
    } catch {
      return '';
    }
  }

  validateProjectStructure() {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      '.env.example',
      'railway.json',
      'RAILWAY_DEPLOY.md',
      'src/app.ts',
      'src/server.ts',
      'src/data-source.ts',
      'src/utils/logger.ts'
    ];

    requiredFiles.forEach(file => {
      if (this.fileExists(file)) {
        this.addResult('STRUCTURE', `File ${file}`, 'PASS', 'Exists');
      } else {
        this.addResult('STRUCTURE', `File ${file}`, 'FAIL', 'Missing required file');
      }
    });
  }

  validatePackageJson() {
    const packageJson = this.readFile('package.json');
    if (!packageJson) {
      this.addResult('PACKAGE', 'package.json', 'FAIL', 'File not found');
      return;
    }

    try {
      const pkg = JSON.parse(packageJson);
      
      // Verificar scripts essenciais
      const requiredScripts = ['start', 'build', 'dev'];
      requiredScripts.forEach(script => {
        if (pkg.scripts && pkg.scripts[script]) {
          this.addResult('PACKAGE', `Script ${script}`, 'PASS', 'Defined');
        } else {
          this.addResult('PACKAGE', `Script ${script}`, 'FAIL', 'Missing required script');
        }
      });

      // Verificar dependências essenciais
      const requiredDeps = ['express', 'typeorm', 'bcryptjs', 'jsonwebtoken', 'cors'];
      requiredDeps.forEach(dep => {
        if (pkg.dependencies && pkg.dependencies[dep]) {
          this.addResult('PACKAGE', `Dependency ${dep}`, 'PASS', 'Installed');
        } else {
          this.addResult('PACKAGE', `Dependency ${dep}`, 'FAIL', 'Missing required dependency');
        }
      });

      // Verificar engines
      if (pkg.engines && pkg.engines.node) {
        this.addResult('PACKAGE', 'Node.js engine', 'PASS', `Specified: ${pkg.engines.node}`);
      } else {
        this.addResult('PACKAGE', 'Node.js engine', 'WARN', 'Engine version not specified');
      }

    } catch (error) {
      this.addResult('PACKAGE', 'package.json parsing', 'FAIL', 'Invalid JSON format');
    }
  }

  validateEnvironmentConfig() {
    const envExample = this.readFile('.env.example');
    if (!envExample) {
      this.addResult('CONFIG', '.env.example', 'FAIL', 'File not found');
      return;
    }

    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'DATABASE_TYPE',
      'JWT_SECRET',
      'BCRYPT_ROUNDS'
    ];

    requiredVars.forEach(varName => {
      if (envExample.includes(varName)) {
        this.addResult('CONFIG', `Env var ${varName}`, 'PASS', 'Documented');
      } else {
        this.addResult('CONFIG', `Env var ${varName}`, 'FAIL', 'Not documented in .env.example');
      }
    });
  }

  validateSecurityFeatures() {
    const appTs = this.readFile('src/app.ts');
    const authTs = this.readFile('src/middleware/auth.ts');

    // Verificar headers de segurança
    if (appTs.includes('X-Content-Type-Options') && appTs.includes('X-Frame-Options')) {
      this.addResult('SECURITY', 'Security headers', 'PASS', 'Implemented');
    } else {
      this.addResult('SECURITY', 'Security headers', 'FAIL', 'Missing security headers');
    }

    // Verificar CORS
    if (appTs.includes('cors(')) {
      this.addResult('SECURITY', 'CORS', 'PASS', 'Configured');
    } else {
      this.addResult('SECURITY', 'CORS', 'FAIL', 'CORS not configured');
    }

    // Verificar autenticação JWT
    if (authTs.includes('jwt.verify')) {
      this.addResult('SECURITY', 'JWT authentication', 'PASS', 'Implemented');
    } else {
      this.addResult('SECURITY', 'JWT authentication', 'FAIL', 'JWT verification not found');
    }
  }

  validateLoggingSystem() {
    const loggerTs = this.readFile('src/utils/logger.ts');
    
    if (!loggerTs) {
      this.addResult('LOGGING', 'Logger system', 'FAIL', 'Logger file not found');
      return;
    }

    if (loggerTs.includes('LogLevel') && loggerTs.includes('class Logger')) {
      this.addResult('LOGGING', 'Logger implementation', 'PASS', 'Professional logging system implemented');
    } else {
      this.addResult('LOGGING', 'Logger implementation', 'FAIL', 'Logger system incomplete');
    }

    // Verificar se console.logs foram removidos dos services
    const serviceFiles = [
      'src/services/PomodoroService.ts',
      'src/services/FlowerService.ts',
      'src/services/TaskService.ts'
    ];

    serviceFiles.forEach(file => {
      const content = this.readFile(file);
      const consoleLogCount = (content.match(/console\.log\(/g) || []).length;
      
      if (consoleLogCount === 0) {
        this.addResult('LOGGING', `${file} console.logs`, 'PASS', 'Debug logs removed');
      } else {
        this.addResult('LOGGING', `${file} console.logs`, 'WARN', `${consoleLogCount} console.log(s) found`);
      }
    });
  }

  validateDatabaseConfig() {
    const dataSourceTs = this.readFile('src/data-source.ts');
    
    if (!dataSourceTs) {
      this.addResult('DATABASE', 'Data source config', 'FAIL', 'data-source.ts not found');
      return;
    }

    // Verificar configuração de produção
    if (dataSourceTs.includes('synchronize: !isProduction')) {
      this.addResult('DATABASE', 'Production safety', 'PASS', 'synchronize disabled in production');
    } else {
      this.addResult('DATABASE', 'Production safety', 'FAIL', 'synchronize not properly configured');
    }

    // Verificar suporte ao Railway
    if (dataSourceTs.includes('DATABASE_URL')) {
      this.addResult('DATABASE', 'Railway support', 'PASS', 'DATABASE_URL supported');
    } else {
      this.addResult('DATABASE', 'Railway support', 'WARN', 'DATABASE_URL not configured');
    }

    // Verificar SSL
    if (dataSourceTs.includes('ssl:')) {
      this.addResult('DATABASE', 'SSL configuration', 'PASS', 'SSL configured for production');
    } else {
      this.addResult('DATABASE', 'SSL configuration', 'WARN', 'SSL configuration not found');
    }
  }

  validateRailwayConfig() {
    const railwayJson = this.readFile('railway.json');
    
    if (!railwayJson) {
      this.addResult('RAILWAY', 'railway.json', 'WARN', 'Railway config file not found');
      return;
    }

    try {
      const config = JSON.parse(railwayJson);
      
      if (config.deploy && config.deploy.startCommand) {
        this.addResult('RAILWAY', 'Start command', 'PASS', 'Defined');
      } else {
        this.addResult('RAILWAY', 'Start command', 'WARN', 'Start command not specified');
      }

      if (config.deploy && config.deploy.healthcheckPath) {
        this.addResult('RAILWAY', 'Health check', 'PASS', 'Health check configured');
      } else {
        this.addResult('RAILWAY', 'Health check', 'WARN', 'Health check not configured');
      }

    } catch {
      this.addResult('RAILWAY', 'railway.json parsing', 'FAIL', 'Invalid JSON format');
    }
  }

  validateHealthEndpoint() {
    const appTs = this.readFile('src/app.ts');
    
    if (appTs.includes('/health')) {
      this.addResult('MONITORING', 'Health endpoint', 'PASS', 'Health check endpoint implemented');
    } else {
      this.addResult('MONITORING', 'Health endpoint', 'FAIL', 'Health check endpoint missing');
    }
  }

  run() {
    console.log('🔍 Iniciando validação de produção...\n');

    this.validateProjectStructure();
    this.validatePackageJson();
    this.validateEnvironmentConfig();
    this.validateSecurityFeatures();
    this.validateLoggingSystem();
    this.validateDatabaseConfig();
    this.validateRailwayConfig();
    this.validateHealthEndpoint();

    this.printResults();
  }

  private printResults() {
    const categories = [...new Set(this.results.map(r => r.category))];
    
    let totalPass = 0;
    let totalFail = 0;
    let totalWarn = 0;

    console.log('📊 RELATÓRIO DE VALIDAÇÃO DE PRODUÇÃO\n');
    console.log('='.repeat(60));

    categories.forEach(category => {
      console.log(`\n📁 ${category}`);
      console.log('-'.repeat(40));
      
      const categoryResults = this.results.filter(r => r.category === category);
      
      categoryResults.forEach(result => {
        const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${emoji} ${result.check}: ${result.message}`);
        
        if (result.status === 'PASS') totalPass++;
        else if (result.status === 'FAIL') totalFail++;
        else totalWarn++;
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO FINAL:');
    console.log(`✅ PASSOU: ${totalPass}`);
    console.log(`⚠️  AVISOS: ${totalWarn}`);
    console.log(`❌ FALHOU: ${totalFail}`);

    const total = totalPass + totalWarn + totalFail;
    const successRate = ((totalPass / total) * 100).toFixed(1);
    
    console.log(`\n🎯 TAXA DE SUCESSO: ${successRate}%`);

    if (totalFail === 0) {
      console.log('\n🎉 PARABÉNS! Projeto 100% pronto para produção!');
      console.log('🚀 Pode fazer deploy no Railway com segurança.');
    } else {
      console.log(`\n⚠️  Corrija ${totalFail} problema(s) antes do deploy.`);
    }

    if (totalWarn > 0) {
      console.log(`\n💡 ${totalWarn} aviso(s) encontrado(s). Considere revisar.`);
    }

    console.log('\n📖 Para deploy: consulte RAILWAY_DEPLOY.md');
  }
}

// Executar validação
const validator = new ProductionValidator();
validator.run();
