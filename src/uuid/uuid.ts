import { v4 as uuid4 } from 'uuid';
import { isUuidString, UuidVersion } from './is-uuid-string';

/**
 * Encapsulates a string UUID for type safety.
 */
export class Uuid {
  private _value: string;

  /**
   * Creates a new UUID object.
   *
   * @param value String representation of the UUID. Optional. If not given,
   *  a random v4 UUID is generated.
   * @param version UUID version to validate the string against. Ignored if
   *   "value" is undefined.
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
