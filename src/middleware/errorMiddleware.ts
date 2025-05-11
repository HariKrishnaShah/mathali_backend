import { Request, Response, NextFunction } from "express";
import AppError from "../util/appError";
import HttpError from "../util/httpError";
import { ValidationErrorException } from "../util/validationError";
import multer from "multer";

const errorMiddleware = (
  err:
    | Error
    | AppError
    | HttpError
    | ValidationErrorException
    | multer.MulterError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let validationErrors: any = null;

  if (err instanceof multer.MulterError) {
    // Handling Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      statusCode = 400;
      message = "File size exceeds the allowed limit.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      statusCode = 400;
      message = "Too many files uploaded.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      statusCode = 400;
      message = "Unexpected file field.";
    } else {
      statusCode = 400;
      message = `Multer error: ${err.message}`;
    }
  } else if (err instanceof AppError || err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ValidationErrorException) {
    statusCode = err.statusCode;
    message = err.message;
    validationErrors = err.validationErrors;
  }

  res.status(statusCode).json({
    Status: statusCode,
    Success: false,
    message: message,
    data: null,
  });
};

export default errorMiddleware;
