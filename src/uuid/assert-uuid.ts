import { BadRequestError } from '../errors';
import { Uuid } from './uuid';
import { UuidVersion } from './is-uuid-string';

/**
 * Creates an Uuid from a string representation, throwing a BadRequestError if
 * the string is invalid.
 * @param value String representation of the UUID.
 * @param version UUID version to validate for. Defaults to UuidVersion.Any.
 */
export function assertUuid(
  value: any,
  version: UuidVersion = UuidVersion.Any
): Uuid {
  try {
    return new Uuid(value, version);
  } catch (err) {
    throw new BadRequestError(err.message);
  }
}
