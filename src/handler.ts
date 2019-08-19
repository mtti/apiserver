import express = require('express');

/**
 * Promisified request handler.
 */
export type WrappedRequestHandler = (req: express.Request, res: express.Response) => Promise<any>;

/**
 * Returns a regular Express request handler when given a `WrappedRequestHandler`. Catches any
 * errors thrown by the wrapped handler and forwards them to the Express error handler.
 */
export function wrapHandler(cb: WrappedRequestHandler): express.RequestHandler {
  return async (req, res, next) => {
    try {
      res.json(await cb(req, res));
    } catch (err) {
      next(err);
    }
  };
}
