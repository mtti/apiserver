import { ApiError, NotFoundError } from './errors';
import { createJsonApiErrorResponse, JSON_API_CONTENT_TYPE } from './json-api';
import { Request, Response } from 'express';

/**
 * An Express error handler that outputs JSON and can handle thrown ApiError
 * instances.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: any
): void {
  if (err instanceof ApiError) {
    res
      .status(err.status)
      .set('Content-Type', JSON_API_CONTENT_TYPE)
      .json(createJsonApiErrorResponse(err));
    return;
  }
  res
    .status(500)
    .set('Content-Type', JSON_API_CONTENT_TYPE)
    .json(createJsonApiErrorResponse(err));
}

/** An Express middleware for producing JSON-formatted 404 errors. */
export function notFoundHandler(req: Request, res: Response, next: any): void {
  next(new NotFoundError());
}
