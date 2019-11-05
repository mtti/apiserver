import { ForbiddenError } from '../errors/ForbiddenError';

/**
 * Throw a `ForbiddenError` if called with a falsy value. Used for streamlining
 * access control checks.
 *
 * @param value The value to check.
 * @param message Optional message to use in the throw exception.
 */
export function assertAccess(value: boolean, message?: string): void {
  if (!value) {
    throw new ForbiddenError(message);
  }
}
