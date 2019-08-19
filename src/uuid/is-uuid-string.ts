const uuidPatterns: { [index: string]: RegExp } = {
  v4: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  v5: /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  any: /^[0-9A-F]{8}-[0-9A-F]{4}-(4|5)[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
};

export enum UuidVersion {
  V4 = 'v4',
  V5 = 'v5',
  Any = 'any',
}

/** Checks if a value is a valid string representation of an UUID. */
export function isUuidString(value: any, version: UuidVersion = UuidVersion.Any): boolean {
  return (
    typeof value === 'string'
    && value.length >= 32 && value.length <= 36
    && uuidPatterns[version].test(value)
  );
}
