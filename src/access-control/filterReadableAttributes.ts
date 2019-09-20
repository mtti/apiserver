import { Document } from '../Document';
import { fromEntries } from '../utils';
import { AccessController } from './AccessController';

/**
 * Create a copy of `document` with only the attributes readable by the session.
 *
 * @param accessController
 * @param slug
 * @param session
 * @param document
 */
export async function filterReadableAttributes<T>(
  accessController: AccessController,
  slug: string,
  session: unknown,
  document: Document<T>,
): Promise<Document<T>> {
  const check = await accessController.getReadableAttributes(session, slug);

  const readableAttributes = fromEntries(Object.entries(document.attributes)
    .filter(([key]) => check(key)));

  return { ...document, attributes: readableAttributes as T };
}
