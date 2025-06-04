import "reflect-metadata";
import { DataSource } from "typeorm";
import { Task } from "./entities/Task";
import { Pomodoro } from "./entities/Pomodoro";
import { User } from "./entities/User";
import { Flower } from "./entities/Flower";
import { Garden } from "./entities/Garden";
import { LumiMemory } from "./entities/LumiMemory";
import { DatabaseManager } from "./config/database-manager";
import * as dotenv from "dotenv";

dotenv.config();

const databaseType = process.env.DATABASE_TYPE as any || "postgres";

const createDataSource = () => {
  if (databaseType === "postgres") {
    return new DataSource({
      type: "postgres",
      host: process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT || "5432"),
      username: process.env.DATABASE_USER || "postgres",
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME || "pomodorotasks",      synchronize: true,
      logging: process.env.NODE_ENV === "development",
      entities: [Task, Pomodoro, User, Flower, Garden, LumiMemory],
      migrations: [],
      subscribers: [],
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  } else {
    return new DataSource({
      type: "sqlite",      database: process.env.DATABASE_PATH || "src/database/database.sqlite",
      synchronize: true,
      logging: false,
      entities: [Task, Pomodoro, User, Flower, Garden, LumiMemory],
      migrations: [],
      subscribers: [],
    });
  }
};

export const AppDataSource = createDataSource();

export const initializeDatabase = async (): Promise<void> => {
  if (databaseType === "postgres") {
    const dbManager = new DatabaseManager();
    await dbManager.createDatabaseIfNotExists();
    
    const connectionSuccess = await dbManager.testConnection();
    if (!connectionSuccess) {
      throw new Error("Failed to connect to PostgreSQL database");
    }
  }
  
  await AppDataSource.initialize();
  console.log(`Data Source initialized successfully with ${databaseType}`);
};