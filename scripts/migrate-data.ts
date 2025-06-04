#!/usr/bin/env node

import { DataSource } from 'typeorm';
import { Task } from '../src/entities/Task';
import { User } from '../src/entities/User';
import { Pomodoro } from '../src/entities/Pomodoro';
import { Flower } from '../src/entities/Flower';
import { Garden } from '../src/entities/Garden';
import * as dotenv from 'dotenv';

dotenv.config();

const sqliteDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DATABASE_PATH || "src/database/database.sqlite",
  entities: [Task, Pomodoro, User, Flower, Garden],
  synchronize: false,
});

const postgresDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "pomodorotasks",
  entities: [Task, Pomodoro, User, Flower, Garden],
  synchronize: true,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function migrateData() {
  try {
    console.log('🔄 Starting data migration from SQLite to PostgreSQL...');
    
    console.log('📊 Connecting to SQLite database...');
    await sqliteDataSource.initialize();
    
    console.log('🐘 Connecting to PostgreSQL database...');
    await postgresDataSource.initialize();
    
    const entities = [
      { name: 'Users', repository: User },
      { name: 'Tasks', repository: Task },
      { name: 'Pomodoros', repository: Pomodoro },
      { name: 'Gardens', repository: Garden },
      { name: 'Flowers', repository: Flower },
    ];
    
    for (const entity of entities) {
      console.log(`\n📋 Migrating ${entity.name}...`);
      
      const sqliteRepo = sqliteDataSource.getRepository(entity.repository);
      const postgresRepo = postgresDataSource.getRepository(entity.repository);
      
      const records = await sqliteRepo.find();
      console.log(`   Found ${records.length} ${entity.name.toLowerCase()} to migrate`);
      
      if (records.length > 0) {
        for (const record of records) {
          try {
            await postgresRepo.save(record);
          } catch (error) {
            console.warn(`   ⚠️  Skipping duplicate or invalid record:`, error.message);
          }
        }
        console.log(`   ✅ ${entity.name} migration completed`);
      } else {
        console.log(`   ℹ️  No ${entity.name.toLowerCase()} to migrate`);
      }
    }
    
    console.log('\n🎉 Data migration completed successfully!');
    console.log('\n📝 Summary:');
    
    for (const entity of entities) {
      const postgresRepo = postgresDataSource.getRepository(entity.repository);
      const count = await postgresRepo.count();
      console.log(`   ${entity.name}: ${count} records`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (sqliteDataSource.isInitialized) {
      await sqliteDataSource.destroy();
    }
    if (postgresDataSource.isInitialized) {
      await postgresDataSource.destroy();
    }
  }
}

async function checkSqliteExists() {
  const fs = require('fs');
  const path = process.env.DATABASE_PATH || "src/database/database.sqlite";
  
  if (!fs.existsSync(path)) {
    console.log('ℹ️  SQLite database not found. No data to migrate.');
    console.log('   This is normal for new installations.');
    return false;
  }
  
  return true;
}

async function main() {
  try {
    const sqliteExists = await checkSqliteExists();
    
    if (!sqliteExists) {
      console.log('✅ No migration needed - starting fresh with PostgreSQL');
      process.exit(0);
    }
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('🤔 SQLite database found. Do you want to migrate data to PostgreSQL? (y/N): ', (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        migrateData();
      } else {
        console.log('ℹ️  Skipping data migration. Starting fresh with PostgreSQL.');
        console.log('💡 You can run this script again later if you change your mind.');
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
