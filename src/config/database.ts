import path from "path";

export const dbConfig = {
  postgres: {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "pomodorotasks",
  },
  sqlite: {
    databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, "..", "database", "database.sqlite"),
  },
  type: (process.env.DATABASE_TYPE as any) || "postgres"
};