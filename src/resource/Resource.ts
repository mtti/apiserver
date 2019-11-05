import {
  AccessController,
  createAccessController,
} from '../access-control/AccessController';
import { assertAccess } from '../access-control/assertAccess';
import {
  assertAllAttributesAllowed,
} from '../access-control/assertAllAttributesAllowed';
import { NotFoundError } from '../errors/NotFoundError';
import { Document } from './Document';
import { ResourceOptions } from './ResourceOptions';
import { Store } from './Store';

/**
 * Wraps a `Store` for access control.
 *
 * Type parameter `A` is the type of the stored document's attributes, `S` is
 * the type of the session object used to authorize operations on the resource.
 */
export class Resource<A extends Record<string, unknown>, S = unknown> {
  private _store: Store<A>;

  private _accessController: AccessController<A, S>;

  constructor(options: ResourceOptions<A, S>) {
    this._store = options.store;
    this._accessController = createAccessController(
      options.accessController || {},
    );
  }

  async create(
    session: S,
    id: string,
    attributes: A,
  ): Promise<Document<A>> {
    // Check that the session is allowed to create documents in this collection
    assertAccess(await this._accessController.authorizeCollectionAction(
      session,
      'create',
    ));

    // Check that all attributes are writable
    assertAllAttributesAllowed(
      session,
      attributes,
      this._accessController.filterWritableAttributes,
    );

    // Check that the session is allowed to create this particular document
    assertAccess(await this._accessController.authorizeDocumentAction(
      session,
      'create',
      attributes,
    ));

    const newDocument = this._store.create(id, attributes);

    // TODO: Filter out unreadable attributes

    return newDocument;
  }

  async read(
    session: S,
    id: string,
  ): Promise<Document<A>|null> {
    const document = await this._store.read(id);
    if (!document) {
      throw new NotFoundError();
    }

    assertAccess(await this._accessController.authorizeDocumentAction(
      session,
      'read',
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
  ): Promise<Document<A>> {
    // Check that all attributes are writable
    assertAllAttributesAllowed(
      session,
      attributes,
      this._accessController.filterWritableAttributes,
    );

    const existing = await this._store.read(id);
    if (!existing) {
      throw new NotFoundError();
    }

    assertAccess(await this._accessController.authorizeDocumentAction(
      session,
      'replace',
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

    assertAccess(await this._accessController.authorizeDocumentAction(
      session,
      'destroy',
      null,
      existing.attributes,
    ));

    await this._store.destroy(id);
  }
}
