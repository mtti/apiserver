import { fromEntries } from '@mtti/funcs';

export function filterObject<T>(
  src: T,
  allowedKeys: string[],
): Partial<T> {
  return fromEntries(Object.entries(src)
    .filter(([key]) => allowedKeys.includes(key)));
}
