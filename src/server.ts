import { initializeDatabase } from "./data-source";
import { app } from "./app";
import * as dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    console.log("Database initialized successfully!");
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Using database: ${process.env.DATABASE_TYPE || "postgres"}`);
    });
  })
  .catch((err) => {
    console.error("Error during database initialization:", err);
    process.exit(1);
  });