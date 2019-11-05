import { fromEntries } from '@mtti/funcs';
import { FullDocument } from './FullDocument';
import { PartialDocument } from './PartialDocument';

/**
 * Remove non-whitelisted attributes from a document.
 *
 * @param src
 * @param allowedKeys List of allowed keys or `true` to allow any key.
 */
export function filterDocument<T>(
  src: FullDocument<T>,
  allowedKeys: string[]|true,
): PartialDocument<T> {
  if (allowedKeys === true) {
    return { ...src };
  }

  const attributes = fromEntries(Object.entries(src.attributes)
    .filter(([key]) => allowedKeys.includes(key)));
  return {
    ...src,
    attributes,
  };
}
