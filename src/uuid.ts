import { v4 as uuid4 } from 'uuid';
import { BadRequestError } from './errors';

const uuidPatterns: { [index:string]: RegExp } = {
  v4: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  v5: /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  any: /^[0-9A-F]{8}-[0-9A-F]{4}-(4|5)[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
};

export enum UuidVersion {
  V4 = 'v4',
  V5 = 'v5',
  Any = 'any',
}

/**
 * Encapsulates a string UUID for type safety.
 */
export class Uuid {
  private _value:string;

  /**
   * Creates a new UUID object.
   *
   * @param value String representation of the UUID. Optional. If not given, a random v4 UUID is
   *  generated.
   * @param version UUID version to validate the string against. Ignored if "value" is undefined.
   */
  constructor(value?: any, version: UuidVersion = UuidVersion.Any) {
    if (!value) {
      this._value = uuid4();
      return;
    }
    if (!isUuidString(value, version)) {
      throw new Error('Not a valid UUID');
    }
    this._value = value.toLowerCase();
  }

  /** Returns a lower-case string representation of the UUID. */
  public toString(): string {
    return this._value;
  }

  /** Same as toString, allows encoding Uuid instances to JSON directly. */
  public toJSON(): any {
    return this._value;
  }
}

/** Checks if a value is a valid string representation of an UUID. */
export function isUuidString(value: any, version: UuidVersion = UuidVersion.Any): boolean {
  return (
    typeof value === 'string'
    && value.length >= 32 && value.length <= 36
    && uuidPatterns[version].test(value)
  );
}

/**
 * Creates an Uuid from a string representation, throwing a BadRequestError if the string is
 * invalid.
 * @param value String representation of the UUID.
 * @param version UUID version to validate for. Defaults to UuidVersion.Any.
 */
export function assertUuid(value: any, version: UuidVersion = UuidVersion.Any): Uuid {
  try {
    return new Uuid(value, version);
  } catch (err) {
    throw new BadRequestError(err.message);
  }
}
