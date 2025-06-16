import "reflect-metadata";
import { DataSource } from "typeorm";
import { Task } from "./entities/Task";
import { Pomodoro } from "./entities/Pomodoro";
import { User } from "./entities/User";
import { Flower } from "./entities/Flower";
import { Garden } from "./entities/Garden";
import { LumiMemory } from "./entities/LumiMemory";
import { DatabaseManager } from "./config/database-manager";
import { logger } from "./utils/logger";
import * as dotenv from "dotenv";

dotenv.config();

const createDataSource = () => {
  const isProduction = process.env.NODE_ENV === "production";
    // Railway/Production: Use DATABASE_URL
  if (process.env.DATABASE_URL) {
    return new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      synchronize: process.env.DB_SYNC === "true", // Allow sync for initial setup
      logging: process.env.NODE_ENV === "development",
      entities: [Task, Pomodoro, User, Flower, Garden, LumiMemory],
      migrations: [],
      subscribers: [],
      ssl: { rejectUnauthorized: false }, // Required for Railway PostgreSQL
    });
  }
  
  // Local development: Use individual config
  return new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "pomodorotasks",
    synchronize: !isProduction,
    logging: process.env.NODE_ENV === "development",
    entities: [Task, Pomodoro, User, Flower, Garden, LumiMemory],
    migrations: [],
    subscribers: [],
    ssl: false,
  });
};

export const AppDataSource = createDataSource();

export const initializeDatabase = async (): Promise<void> => {
  try {
    // In production with DATABASE_URL, skip database creation check
    if (process.env.DATABASE_URL) {
      logger.database("Using DATABASE_URL for connection");
      await AppDataSource.initialize();
      logger.database("Data Source initialized successfully with PostgreSQL (Railway)");
      return;
    }
    
    // Local development: check/create database
    const dbManager = new DatabaseManager();
    await dbManager.createDatabaseIfNotExists();
    
    const connectionSuccess = await dbManager.testConnection();
    if (!connectionSuccess) {
      throw new Error("Failed to connect to PostgreSQL database");
    }
    
    await AppDataSource.initialize();
    logger.database("Data Source initialized successfully with PostgreSQL (Local)");
  } catch (error) {
    logger.error("Database initialization failed:", error);
    throw error;
  }
};