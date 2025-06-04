#!/usr/bin/env node

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { DatabaseManager } from '../src/config/database-manager';

dotenv.config();

async function resetDatabase() {
  try {
    const dbType = process.env.DATABASE_TYPE || 'postgres';
    
    if (dbType !== 'postgres') {
      console.log('⚠️  Database reset is only supported for PostgreSQL');
      process.exit(1);
    }
    
    console.log('🗑️  Resetting PostgreSQL database...');
    
    const dbManager = new DatabaseManager();
    const config = dbManager.getConnectionConfig();
    
    const adminClient = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: 'postgres'
    });
    
    try {
      await adminClient.connect();
      console.log('🔗 Connected to PostgreSQL server');
      
      await adminClient.query(`DROP DATABASE IF EXISTS "${config.database}"`);
      console.log(`🗑️  Dropped database "${config.database}" if it existed`);
      
      await adminClient.query(`CREATE DATABASE "${config.database}"`);
      console.log(`📊 Created fresh database "${config.database}"`);
      
    } finally {
      await adminClient.end();
    }
    
    console.log('✅ Database reset completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Run "npm run db:setup" to initialize the database schema');
    console.log('  2. Run "npm run dev" to start the development server');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
