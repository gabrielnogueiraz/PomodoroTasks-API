import { initializeDatabase } from "./data-source";
import { app } from "./app";
import { logger } from "./utils/logger";
import * as dotenv from "dotenv";

dotenv.config();

process.env.NODE_OPTIONS = "--max-old-space-size=4096";

const PORT = process.env.PORT || 8080;

initializeDatabase()
  .then(() => {
    logger.database("Database initialized successfully!");

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, "SERVER");
      logger.info(`Using database: ${process.env.DATABASE_TYPE || "postgres"}`, "SERVER");
    });
  })
  .catch((err) => {
    logger.error("Error during database initialization", "SERVER", err);
    process.exit(1);
  });
