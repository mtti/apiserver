import { ForbiddenError } from '../errors/ForbiddenError';
import { AttributeFilterFunc } from './AttributeFilterFunc';

/**
 * Throws a `ForbiddenError` if any attribute is disallowed by the filter
 * callback.
 *
 * @param attributes
 * @param cb
 */
export function assertAllAttributesAllowed<S>(
  session: S,
  attributes: Record<string, unknown>,
  cb: AttributeFilterFunc<S>,
): void {
  const disallowedKeys = Object.keys(attributes)
    .filter((key) => !cb(session, key));
  if (disallowedKeys.length > 0) {
    throw new ForbiddenError(
      `Attributes not allowded: ${disallowedKeys.join(',')}`,
    );
  }
}
