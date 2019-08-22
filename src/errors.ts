import Ajv = require('Ajv');
import { JsonApiError } from './json-api';

/** Error to throw when a runtime type assertation fails. */
export class TypeAssertationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Base class for all apiserver errors.
 */
export class ApiError extends Error {
  private _status: number;

  public get status(): number {
    return this._status;
  }

  constructor(status: number, message: string) {
    super(message);
    this._status = status;
  }

  public toJsonApi(): JsonApiError[] {
    const result: JsonApiError = {
      status: this._status.toString(),
      title: this.message,
    };

    if (process.env.NODE_ENV !== 'production') {
      result.meta = {
        stack: this.stack,
      };
    }

    return [ result ];
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class NotAcceptableError extends ApiError {
  constructor(message = 'Not Acceptable') {
    super(406, message);
  }
}

export class UnsupportedMediaTypeError extends ApiError {
  constructor(message = 'Unsupported Media Type') {
    super(415, message);
  }
}

/** Base class for JSON schema violations. */
export class JSONSchemaViolationError extends ApiError {
  private _errors: Ajv.ErrorObject[];

  constructor(errors: Ajv.ErrorObject[], status = 500, message = 'JSON Schema Violation') {
    super(status, message);
    this._errors = [...errors];
  }

  get errors(): Ajv.ErrorObject[] {
    if (this._errors) {
      return [ ...this._errors ];
    }
    return [];
  }
}

/** Throw when request body doesn't match JSON schema. */
export class RequestBodyValidationError extends JSONSchemaViolationError {
  constructor(errors: Ajv.ErrorObject[], message = 'Invalid Request Body') {
    super(errors, 400, message);
  }
}

/** Error throw when outgoing data does not match contract. */
export class ContractViolationError extends JSONSchemaViolationError {
  constructor(errors: Ajv.ErrorObject[], message = 'Contract Violation') {
    super(errors, 500, message);
  }
}
