#!/usr/bin/env node

import * as dotenv from 'dotenv';

dotenv.config();

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateDatabaseConfig(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const dbType = process.env.DATABASE_TYPE || 'postgres';
  
  if (dbType === 'postgres') {
    const requiredVars = [
      'DATABASE_HOST',
      'DATABASE_PORT', 
      'DATABASE_NAME',
      'DATABASE_USER',
      'DATABASE_PASSWORD'
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        result.errors.push(`Missing required environment variable: ${varName}`);
        result.isValid = false;
      }
    }

    if (process.env.DATABASE_PORT && isNaN(parseInt(process.env.DATABASE_PORT))) {
      result.errors.push('DATABASE_PORT must be a valid number');
      result.isValid = false;
    }

    if (!process.env.JWT_SECRET) {
      result.warnings.push('JWT_SECRET not set - using default (not recommended for production)');
    }

    if (process.env.DATABASE_PASSWORD === 'your_password_here') {
      result.warnings.push('DATABASE_PASSWORD appears to be a placeholder - please set a real password');
    }

  } else if (dbType === 'sqlite') {
    if (!process.env.DATABASE_PATH) {
      result.warnings.push('DATABASE_PATH not set - using default SQLite path');
    }
  } else {
    result.errors.push(`Invalid DATABASE_TYPE: ${dbType}. Must be 'postgres' or 'sqlite'`);
    result.isValid = false;
  }

  return result;
}

function main() {
  console.log('🔍 Validating configuration...\n');

  if (!require('fs').existsSync('.env')) {
    console.log('⚠️  .env file not found');
    console.log('📋 Please copy .env.example to .env and configure your settings\n');
    console.log('Commands:');
    console.log('  cp .env.example .env');
    console.log('  # Edit .env with your database credentials');
    process.exit(1);
  }

  const validation = validateDatabaseConfig();

  if (validation.errors.length > 0) {
    console.log('❌ Configuration errors found:');
    validation.errors.forEach(error => console.log(`   • ${error}`));
    console.log();
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  Configuration warnings:');
    validation.warnings.forEach(warning => console.log(`   • ${warning}`));
    console.log();
  }

  if (validation.isValid) {
    console.log('✅ Configuration is valid!');
    console.log(`📊 Database type: ${process.env.DATABASE_TYPE || 'postgres'}`);
    
    if (process.env.DATABASE_TYPE === 'postgres' || !process.env.DATABASE_TYPE) {
      console.log(`🐘 PostgreSQL: ${process.env.DATABASE_USER}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`);
    }
    
    console.log('\n📝 Next steps:');
    console.log('  1. npm run db:setup    # Setup database');
    console.log('  2. npm run dev         # Start development server');
    
  } else {
    console.log('❌ Please fix the configuration errors before proceeding');
    process.exit(1);
  }
}

main();
