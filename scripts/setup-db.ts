#!/usr/bin/env node

import { DatabaseManager } from '../src/config/database-manager';
import { initializeDatabase } from '../src/data-source';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    const dbType = process.env.DATABASE_TYPE || 'postgres';
    console.log(`📊 Database type: ${dbType}`);
    
    if (dbType === 'postgres') {
      console.log('🐘 Setting up PostgreSQL database...');
      
      const dbManager = new DatabaseManager();
      
      console.log('📋 Creating database if it doesn\'t exist...');
      await dbManager.createDatabaseIfNotExists();
      
      console.log('🔗 Testing database connection...');
      const connectionSuccess = await dbManager.testConnection();
      
      if (!connectionSuccess) {
        throw new Error('Failed to connect to PostgreSQL database');
      }
      
      console.log('✅ PostgreSQL connection successful!');
    }
    
    console.log('🏗️  Initializing TypeORM...');
    await initializeDatabase();
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Make sure your .env file has the correct database credentials');
    console.log('  2. Run "npm run dev" to start the development server');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Make sure PostgreSQL is running');
    console.log('  2. Check your database credentials in .env file');
    console.log('  3. Ensure the database user has CREATE DATABASE permissions');
    process.exit(1);
  }
}

setupDatabase();
