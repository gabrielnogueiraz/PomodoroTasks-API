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
  const productionOrigins = [
    "https://usetoivo.vercel.app",
    "https://toivo.vercel.app",
    "https://pomodoro-tasks-api.vercel.app",
    process.env.FRONTEND_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
  ].filter(Boolean);

  const developmentOrigins = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:5000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ];

  if (process.env.NODE_ENV === "production") {
    logger.info(`Production CORS Origins: ${JSON.stringify(productionOrigins)}`);
    logger.info(`FRONTEND_URL env var: ${process.env.FRONTEND_URL}`);
    logger.info(`RAILWAY_PUBLIC_DOMAIN env var: ${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    return productionOrigins;
  }
  
  // Em desenvolvimento, retorna todas as origins permitidas
  return [...developmentOrigins, ...productionOrigins];
};

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    
    logger.info(`CORS check for origin: ${origin}`);
    logger.info(`Allowed origins: ${JSON.stringify(allowedOrigins)}`);
    
    // Em desenvolvimento, permite qualquer origin
    if (process.env.NODE_ENV !== "production") {
      logger.info(`Development mode: allowing all origins`);
      return callback(null, true);
    }
    
    // Permite requisições sem origin (ex: Postman, curl)
    if (!origin) {
      logger.info(`No origin header present - allowing request`);
      return callback(null, true);
    }
    
    // Em produção, verifica lista de origins permitidas
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
      logger.info(`Origin ${origin} is allowed`);
      return callback(null, true);
    } else {
      logger.warn(`CORS blocked for origin: ${origin}`);
      logger.warn(`Allowed origins were: ${JSON.stringify(allowedOrigins)}`);
      return callback(new Error(`CORS policy: Origin ${origin} is not allowed`), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "X-CSRF-Token"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// Log CORS configuration for debugging
logger.info(`CORS Origins: ${JSON.stringify(getAllowedOrigins())}`);

app.use(cors(corsOptions));

// Middleware adicional para CORS em produção com logging detalhado
const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  
  // Log detalhado para debugging
  if (req.method === 'OPTIONS') {
    logger.info(`OPTIONS request from origin: ${origin}`);
    logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
  }
  
  if (process.env.NODE_ENV === "production") {
    // Sempre permitir a URL principal do frontend
    const isAllowedOrigin = !origin || 
      origin === "https://usetoivo.vercel.app" || 
      (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin));
    
    if (isAllowedOrigin && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      logger.info(`Set CORS origin header to: ${origin}`);
    } else if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      logger.info(`No origin header - set to wildcard`);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    if (req.method === 'OPTIONS') {
      logger.info(`Responding to OPTIONS preflight request`);
      res.status(200).end();
      return;
    }
  }
  
  next();
};

app.use(corsMiddleware);
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

// CORS debug endpoint
app.get("/cors-debug", (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  
  res.status(200).json({
    message: "CORS Debug Information",
    requestOrigin: origin || "No origin header",
    allowedOrigins: allowedOrigins,
    environment: process.env.NODE_ENV || "development",
    frontendUrl: process.env.FRONTEND_URL,
    railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
    corsHeaders: {
      "Access-Control-Allow-Origin": res.getHeader("Access-Control-Allow-Origin"),
      "Access-Control-Allow-Methods": res.getHeader("Access-Control-Allow-Methods"),
      "Access-Control-Allow-Headers": res.getHeader("Access-Control-Allow-Headers"),
      "Access-Control-Allow-Credentials": res.getHeader("Access-Control-Allow-Credentials"),
    },
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
