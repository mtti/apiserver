import Ajv = require('ajv');
import { Request, Response } from 'express';
import { BadRequestError } from './errors';

const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const emailRegex = /^[0-9a-zA-Z\.\+\_]+@[0-9a-zA-Z\.\-]+$/;

export interface ErrorConstructor {
  new (message: string): Error;
}

type AssertationFunc<T> = (subject: T) => void;

export function requireUuid(...keys: string[]) {
  return (req: Request, res: Response, next: any) => {
    for (const key of keys) {
      if (!req.params[key]) {
        next(new BadRequestError(`Missing parameter: ${key}`));
        return;
      }

      if (!uuidRegex.test(req.params[key])) {
        next(new BadRequestError(`Not a valid UUID: ${key}`));
        return;
      }
    }
    next();
  };
}

/**
 * Creates a function which will throw an error if called with a parameter which doesn't validate
 * according to the JSON schema.
 * @param schema The JSON schema to validate against.
 */
export function jsonSchemaValidator(schema: object): AssertationFunc<object> {
  const ajv = new Ajv();
  const valid = ajv.compile(schema);

  return (obj: object, errorClass: ErrorConstructor = Error) => {
    if (!valid(obj)) {
      throw new errorClass('JSON schema validation failed');
    }
  };
}

/** Throw an exception if the value doesn't look like an email address.  */
export function assertEmail(value: string, errorClass: ErrorConstructor = Error): string {
  if (!emailRegex.test(value)) {
    throw new errorClass('Not a valid email address');
  }
  return value;
}
