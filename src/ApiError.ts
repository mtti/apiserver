import { JsonApiError } from './json-api/types';

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

    return [result];
  }
}
