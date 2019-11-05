/**
 * Callback for authorizing actions targeting collections.
 */
export type AuthorizeCollectionActionFunc<S> = (
  session: S,
  action: string,
  slug: string,
) => Promise<boolean>;

/**
 * Restrictive implementation of `AuthorizeCollectionActionFunc` which forbids
 * every action.
 */
export const restrictiveAuthorizeCollectionAction:
  AuthorizeCollectionActionFunc<any> = async (
    session: any,
    action: string,
    slug: string,
  ) => false;

/**
 * Permissive implementation of `AuthorizeCollectionActionFunc` which allows
 * every action.
 */
export const permissiveAuthorizeCollectionAction:
  AuthorizeCollectionActionFunc<any> = async (
    session: any,
    action: string,
    slug: string,
  ) => true;
