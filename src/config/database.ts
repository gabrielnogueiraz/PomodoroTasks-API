import path from "path";

export const dbConfig = {
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, "..", "database", "database.sqlite"),
};