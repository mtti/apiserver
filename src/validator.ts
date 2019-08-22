import Ajv = require('ajv');
import { all as builtInJsonSchemas } from './json-schemas';
import { ContractViolationError, RequestBodyValidationError } from './errors';

/**
 * Wraps Ajv and provides helper functions for doing JSON schema validation.
 */
export class Validator {
  private _ajv: Ajv.Ajv;

  constructor() {
    this._ajv = new Ajv();
    this._ajv.addSchema(builtInJsonSchemas);
  }

  /**
   * Adds a schema to the underlying JSON schema validator.
   * @param schema Schema or an array of schemas.
   */
  public addSchema(schema: object|object[]): void {
    this._ajv.addSchema(schema);
  }

  /**
   * Throw a `RequestBodyValidationError` if an object doesn't match a JSON
   * schema.
   *
   * @param schema Name of JSON schema to validate against.
   * @param data Request body.
   * @returns The `data` argument.
   */
  public assertRequestBody<T>(schema: string, data: any): T {
    const [valid, errors] = this.validateSchema(schema, data);
    if (valid) {
      return data as T;
    }
    throw new RequestBodyValidationError(errors || [], 'Invalid request body');
  }

  /**
   * Validate a JSON response against a contract, throwing
   * `ContractViolationError` on failure.
   *
   * @param schema Name of JSON schema to validate agains.
   * @param data Response body.
   * @returns The `data` argument.
   */
  public assertResponse(schema: string, data: any): any {
    const [valid, errors] = this.validateSchema(schema, data);
    if (valid) {
      return data;
    }
    throw new ContractViolationError(errors || [], `Response body violates contract ${schema}`);
  }

  /**
   * Validate an object against a JSON schema.
   *
   * @param schema Schema ref to validate against.
   * @param data Object to validate.
   * @returns An array with validation status and errors, if any.
   */
  public validateSchema(
    schema: string,
    data: any
  ): [boolean, Ajv.ErrorObject[]|null] {
    if (this._ajv.validate(schema, data)) {
      return [true, null];
    }

    if (this._ajv.errors) {
      return [false, [...this._ajv.errors]];
    }

    return [false, null];
  }
}
