/**
 * Authorize a session to access a document after it's fully loaded from the
 * store but before its fields have been filtered.
 *
 * @param session
 * @param resource
 * @param action
 * @param document
 */
export type DocumentAccessController<Sess, Attr> = (
  session: Sess,
  resource: string,
  action: string,
  attributes: Attr,
  oldAttributes?: Attr,
) => Promise<boolean>;

/**
 * The default implementation of `DocumentAccessController` which pemits all
 * access, allowing you to rely on just pre-authorization and attribute
 * filtering when more granular access control is not needed.
 */
export async function defaultDocumentAccessController<Sess, Attrs>(
  session: Sess,
  resource: string,
  action: string,
  attributes: Attrs,
  oldAttributes?: Attrs,
): Promise<boolean> {
  return true;
}
