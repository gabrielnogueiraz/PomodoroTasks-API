import "reflect-metadata";
import { DataSource } from "typeorm";
import { Task } from "./entities/Task";
import { Pomodoro } from "./entities/Pomodoro";
import { User } from "./entities/User";
import { Flower } from "./entities/Flower";
import { Garden } from "./entities/Garden";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DATABASE_PATH || "src/database/database.sqlite",
  synchronize: true,
  logging: false,
  entities: [Task, Pomodoro, User, Flower, Garden],
  migrations: [],
  subscribers: [],
});