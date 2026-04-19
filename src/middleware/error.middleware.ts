import type { NextFunction, Request, Response } from "express";
import { ApplicationException } from "../common/exceptions";

export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ApplicationException) {
    return res.status(error.statusCode).json({
      message: error.message,
      cause: error.cause,
    });
  }

  return res.status(500).json({
    message: error.message || "internal server error",
    cause: error.cause,
    stack: error.stack,
  });
};