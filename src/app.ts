import express, {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import "express-async-errors";
import { routes } from "./routes/index";

const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? process.env.FRONTEND_URL || false 
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
    ...(isProduction ? {} : { stack: err.stack })
  });
};

app.use(errorHandler);

export { app };
