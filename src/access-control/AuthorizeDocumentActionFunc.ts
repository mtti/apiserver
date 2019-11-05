/**
 * Callback for authorizing actions targeting document instances.
 *
 * @param session The session attempting to perform the action.
 * @param action Name of the action being performed.
 * @param slug Slug of the resource collection the action is being performed on.
 * @param newAttributes New attributes being written to persistent storage,
 *  if any.
 * @param oldAttributes Attributes currently in persistent storage, if any.
 */
export type AuthorizeDocumentActionFunc<A, S> = (
  session: S,
  action: string,
  slug: string,
  newAttributes?: A|null,
  oldAttributes?: A,
) => Promise<boolean>;

/**
 * Restrictive implementation of `AuthorizeDocumentActionFunc` which forbids
 * every action.
 */
export const restrictiveAuthorizeDocumentAction:
  AuthorizeDocumentActionFunc<any, any> = async (
    session: any,
    action: string,
    slug: string,
    newAttributes: any,
    oldAttributes: any,
  ) => false;

/**
 * Permissive implementation of `AuthorizeDocumentActionFunc` which allows
 * every action.
 */
export const permissiveAuthorizeDocumentAction:
  AuthorizeDocumentActionFunc<any, any> = async (
    session: any,
    action: string,
    slug: string,
    newAttributes: any,
    oldAttributes: any,
  ) => true;
