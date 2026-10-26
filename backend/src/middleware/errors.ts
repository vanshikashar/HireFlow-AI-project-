import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler
} from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export function notFound(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} not found`
  });
}

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
    return;
  }

  if (error?.code === 11000) {
    res.status(409).json({
      error: "DUPLICATE_RESOURCE",
      message: "This record already exists"
    });
    return;
  }

  if (error?.name === "CastError") {
    res.status(400).json({
      error: "INVALID_ID",
      message: "The supplied identifier is invalid"
    });
    return;
  }

  const statusCode =
    error instanceof ApiError ? error.statusCode : 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
    message:
      statusCode >= 500
        ? "An unexpected server error occurred"
        : error.message
  });
};