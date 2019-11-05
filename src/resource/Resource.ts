import { assertAccess } from '../access-control/assertAccess';
import { assertAllAttributesAllowed }
  from '../access-control/assertAllAttributesAllowed';
import { AttributeFilterFunc, permissiveAttributeFilter }
  from '../access-control/AttributeFilterFunc';
import { AuthorizeCollectionActionFunc, restrictiveAuthorizeCollectionAction }
  from '../access-control/AuthorizeCollectionActionFunc';
import { AuthorizeDocumentActionFunc, restrictiveAuthorizeDocumentAction }
  from '../access-control/AuthorizeDocumentActionFunc';
import { NotFoundError } from '../errors/NotFoundError';
import { FullDocument } from './FullDocument';
import { ResourceOptions } from './ResourceOptions';
import { Store } from './Store';

/**
 * Wraps a `Store` for access control.
 *
 * Type parameter `A` is the type of the stored document's attributes, `S` is
 * the type of the session object used to authorize operations on the resource.
 */
export class Resource<A extends Record<string, unknown>, S = unknown> {
  private _slug: string;

  private _store: Store<A>;

  private _authorizeCollectionAction: AuthorizeCollectionActionFunc<S>;

  private _authorizeDocumentAction: AuthorizeDocumentActionFunc<A, S>;

  private _filterReadableAttributes: AttributeFilterFunc<S>;

  private _filterWritableAttributes: AttributeFilterFunc<S>;

  constructor(options: ResourceOptions<A, S>) {
    this._slug = options.slug;
    this._store = options.store;

    this._authorizeCollectionAction = options.authorizeCollectionAction ||
      restrictiveAuthorizeCollectionAction;
    this._authorizeDocumentAction = options.authorizeDocumentAction ||
      restrictiveAuthorizeDocumentAction;
    this._filterReadableAttributes = options.filterReadableAttributes ||
      permissiveAttributeFilter;
    this._filterWritableAttributes = options.filterWritableAttributes ||
      permissiveAttributeFilter;
  }

  async create(
    session: S,
    id: string,
    attributes: A,
  ): Promise<FullDocument<A>> {
    // Check that the session is allowed to create documents in this collection
    assertAccess(await this._authorizeCollectionAction(
      session,
      'create',
      this._slug,
    ));

    // Check that all attributes are writable
    assertAllAttributesAllowed(
      session,
      attributes,
      this._filterWritableAttributes,
    );

    // Check that the session is allowed to create this particular document
    assertAccess(await this._authorizeDocumentAction(
      session,
      'create',
      this._slug,
      attributes,
    ));

    const newDocument = this._store.create(id, attributes);

    // TODO: Filter out unreadable attributes

    return newDocument;
  }

  async read(
    session: S,
    id: string,
  ): Promise<FullDocument<A>|null> {
    const document = await this._store.read(id);
    if (!document) {
      throw new NotFoundError();
    }

    assertAccess(await this._authorizeDocumentAction(
      session,
      'read',
      this._slug,
      null,
      document.attributes,
    ));

    // TODO: filter out unreadable fields

    return this._store.read(id);
  }

  async replace(
    session: S,
    id: string,
    attributes: A,
  ): Promise<FullDocument<A>> {
    // Check that all attributes are writable
    assertAllAttributesAllowed(
      session,
      attributes,
      this._filterWritableAttributes,
    );

    const existing = await this._store.read(id);
    if (!existing) {
      throw new NotFoundError();
    }

    assertAccess(await this._authorizeDocumentAction(
      session,
      'replace',
      this._slug,
      attributes,
      existing.attributes,
    ));

    const newDocument = this._store.replace(id, attributes);

    // TODO: filter our unreadable fields

    return newDocument;
  }

  async destroy(
    session: S,
    id: string,
  ): Promise<void> {
    const existing = await this._store.read(id);
    if (!existing) {
      return;
    }

    assertAccess(await this._authorizeDocumentAction(
      session,
      'destroy',
      this._slug,
      null,
      existing.attributes,
    ));

    await this._store.destroy(id);
  }
}
