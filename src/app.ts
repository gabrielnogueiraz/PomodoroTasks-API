import express, { NextFunction, Request, Response, ErrorRequestHandler } from "express";
import cors from "cors";
import "express-async-errors";
import { routes } from "./routes/index";

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    status: "error",
    message: "Internal server error"
  });
};

app.use(errorHandler);

export { app };