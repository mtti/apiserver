import Ajv from 'ajv';

/** Base class for JSON schema violations. */
export class JsonSchemaViolationError extends Error {
  private _errors: Ajv.ErrorObject[];

  constructor(errors: Ajv.ErrorObject[]) {
    super('JSON Schema Violation');
    this._errors = [...errors];
  }

  get errors(): Ajv.ErrorObject[] {
    if (this._errors) {
      return [...this._errors];
    }
    return [];
  }
}
