import { AccessController } from './AccessController';
import { UnwritableAttributesError } from './errors';

/**
 * Throw an `UnwritableAttributesError` if any of the attributes are unwritable
 * by the session.
 *
 * @param accessController
 * @param slug
 * @param session
 * @param attributes
 */
export async function assertWritableAttributes(
  accessController: AccessController,
  slug: string,
  session: unknown,
  attributes: Record<string, unknown>
): Promise<void> {
  const check = await accessController.getWritableAttributes(session, slug);

  const forbiddenAttributes = Object.entries(attributes)
    .filter(([key,]) => !check(key))
    .map(([key,]) => key);

  if (forbiddenAttributes.length > 0) {
    throw new UnwritableAttributesError(forbiddenAttributes);
  }
}
