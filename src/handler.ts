import express = require('express');

/** Promisified request handler. */
export type WrappedRequestHandler = (req: express.Request, res: express.Response) => Promise<any>;

/**
 * Wrap a JSON request handler. The wrapped handler can resolve to an object which will be sent
 * to the client as a response, or throw an exception which will be caught and sent to the Express
 * error handler.
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
