import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export class DatabaseManager {
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'pomodorotasks'
    };
  }

  async createDatabaseIfNotExists(): Promise<void> {
    const adminClient = new Client({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: 'postgres'
    });

    try {
      await adminClient.connect();
      console.log('Connected to PostgreSQL server');

      const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
      const result = await adminClient.query(checkDbQuery, [this.config.database]);

      if (result.rows.length === 0) {
        const createDbQuery = `CREATE DATABASE "${this.config.database}"`;
        await adminClient.query(createDbQuery);
        console.log(`Database "${this.config.database}" created successfully`);
      } else {
        console.log(`Database "${this.config.database}" already exists`);
      }
    } catch (error) {
      console.error('Error managing database:', error);
      throw error;
    } finally {
      await adminClient.end();
    }
  }

  async testConnection(): Promise<boolean> {
    const client = new Client(this.config);

    try {
      await client.connect();
      await client.query('SELECT NOW()');
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    } finally {
      await client.end();
    }
  }

  getConnectionConfig(): DatabaseConfig {
    return { ...this.config };
  }
}
