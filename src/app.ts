import express, {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import "express-async-errors";
import { routes } from "./routes/index";
import { logger } from "./utils/logger";

const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === "production") {
    const origins = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
    ].filter(Boolean);

    return origins.length > 0 ? origins : false;
  }
  return true; // Desenvolvimento: permite qualquer origin
};

const corsOptions = {
  origin: getAllowedOrigins(),
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200, // Para suporte a browsers antigos
};

// Log CORS configuration for debugging
logger.info(`CORS Origins: ${JSON.stringify(getAllowedOrigins())}`);

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Additional health check for Railway
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Toivo API is running successfully!",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use(routes);

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    console.error(err);
  }

  // Log error details for monitoring in production
  if (isProduction) {
    console.error(`[${new Date().toISOString()}] ${err.message}`);
  }

  res.status(500).json({
    status: "error",
    message: isProduction ? "Internal server error" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

app.use(errorHandler);

export { app };
