import {
  AuthorizeCollectionActionFunc,
  permissiveAuthorizeCollectionAction,
} from './AuthorizeCollectionActionFunc';
import {
  AuthorizeDocumentActionFunc,
  permissiveAuthorizeDocumentAction,
} from './AuthorizeDocumentActionFunc';
import {
  AttributeFilterFunc, permissiveAttributeFilter,
} from './AttributeFilterFunc';

export type AccessController<Attrs, Sess> = {
  authorizeCollectionAction: AuthorizeCollectionActionFunc<Sess>;

  authorizeDocumentAction: AuthorizeDocumentActionFunc<Attrs, Sess>;

  filterReadableAttributes: AttributeFilterFunc<Sess>;

  filterWritableAttributes: AttributeFilterFunc<Sess>;
};

function createPermissiveAccessController<Attrs, Sess>(
): AccessController<Attrs, Sess> {
  return {
    authorizeCollectionAction: permissiveAuthorizeCollectionAction,
    authorizeDocumentAction: permissiveAuthorizeDocumentAction,
    filterReadableAttributes: permissiveAttributeFilter,
    filterWritableAttributes: permissiveAttributeFilter,
  };
}

/**
 * Create a complete access controller from a partial one, setting any missing
 * handlers to permissive defaults.
 *
 * @param values
 */
export function createAccessController<Attrs, Sess>(
  values: Partial<AccessController<Attrs, Sess>>,
): AccessController<Attrs, Sess> {
  return {
    ...createPermissiveAccessController(),
    ...values,
  };
}
