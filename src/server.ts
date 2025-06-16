import { initializeDatabase } from "./data-source";
import { app } from "./app";
import { logger } from "./utils/logger";
import * as dotenv from "dotenv";

dotenv.config();

process.env.NODE_OPTIONS = "--max-old-space-size=4096";

const PORT = Number(process.env.PORT) || 8080;

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...', "SERVER");
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...', "SERVER"); 
  process.exit(0);
});

initializeDatabase()
  .then(() => {
    logger.database("Database initialized successfully!");

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Toivo server is running on port ${PORT}`, "SERVER");
      logger.info(`📊 Using database: ${process.env.DATABASE_TYPE || "postgres"}`, "SERVER");
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`, "SERVER");
      
      // Railway health check confirmation
      if (process.env.RAILWAY_ENVIRONMENT) {
        logger.info(`🚄 Railway deployment successful!`, "SERVER");
      }
    });

    server.on('error', (err) => {
      logger.error('Server error occurred', "SERVER", err);
    });
  })
  .catch((err) => {
    logger.error("❌ Error during database initialization", "SERVER", err);
    process.exit(1);
  });
