import { Request, Response } from 'express';
import { ApiError, NotFoundError, IErrorJson } from './errors';

/** An Express error handler that outputs JSON and can handle thrown ApiError instances. */
export function errorHandler(err: Error, req: Request, res: Response, next: any) {
  if (err instanceof ApiError) {
    res
      .status(err.status)
      .json(err.toJson());
    return;
  }

  const errorJson: IErrorJson = {
    message: 'Internal Server Error',
  };
  if (process.env.NODE_ENV !== 'production') {
    errorJson.stack = err.stack;
    errorJson.originalMessage = err.message;
  }
  res.status(500).json(errorJson);
}

/** An Express middleware for producing JSON-formatted 404 errors. */
export function notFoundHandler(req: Request, res: Response, next: any) {
  next(new NotFoundError());
}
