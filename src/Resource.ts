import { AccessController } from './AccessController';
import { Document } from './Document';
import {
  defaultDocumentAccessController,
  DocumentAccessController,
} from './DocumentAccessController';
import { Store } from './Store';
import { ForbiddenError, NotFoundError } from './errors';
import { Uuid } from './uuid';
import { filterReadableAttributes } from './filterReadableAttributes';
import { assertWritableAttributes } from './assertWritableAttributes';

function assertAccess(value: boolean): void {
  if (!value) {
    throw new ForbiddenError();
  }
}

export type ResourceOptions<Attrs extends Record<string, unknown>, Sess> = {
  documentAccessController?: DocumentAccessController<Sess, Attrs>;
};

export class Resource<Attrs extends Record<string, unknown>, Sess> {
  private _accessController: AccessController<Sess>;
  private _documentAccessController: DocumentAccessController<Sess, Attrs>
    = defaultDocumentAccessController;
  private _name: string;
  private _store: Store<Attrs>;

  constructor(
    accessController: AccessController<Sess>,
    name: string,
    store: Store<Attrs>,
    options?: ResourceOptions<Attrs, Sess>,
  ) {
    this._accessController = accessController;
    this._name = name;
    this._store = store;

    if (options) {
      this._documentAccessController = options.documentAccessController
        || this._documentAccessController;
    }
  }

  /**
   * Create a new document with a server-generated ID.
   *
   * @param session
   * @param attributes
   */
  async create(
    session: Sess,
    attributes: Attrs,
  ): Promise<Document<Attrs>> {
    assertAccess(this._accessController.mightWrite(session, this._name))
    assertAccess(await this._accessController.canDoCollectionAction(
      session,
      'create',
      this._name,
    ));

    await assertWritableAttributes(
      this._accessController,
      this._name,
      session,
      attributes
    );

    assertAccess(await this._documentAccessController(
      session,
      this._name,
      'create',
      attributes,
    ));

    const id = new Uuid().toString();
    const newDocument = await this._store.create(id, attributes);

    return filterReadableAttributes(
      this._accessController,
      this._name,
      session,
      newDocument
    );
  }

  /**
   * Read an existing document.
   *
   * @param session
   * @param id
   */
  async read(
    session: Sess,
    id: string
  ): Promise<Document<Attrs>|null> {
    assertAccess(this._accessController.mightRead(session, this._name));
    assertAccess(await this._accessController.mightDoAction(
      session,
      'read',
      this._name,
    ));

    const document = await this._store.read(id);
    if (!document) {
      return null;
    }

    assertAccess(await this._documentAccessController(
      session,
      this._name,
      'read',
      document.attributes,
    ));

    return filterReadableAttributes(
      this._accessController,
      this._name,
      session,
      document,
    );
  }

  /**
   * Completely replace a document with a new version.
   *
   * @param session
   * @param id
   * @param attributes
   */
  async replace(
    session: Sess,
    id: string,
    attributes: Attrs
  ): Promise<Document<Attrs>> {
    assertAccess(this._accessController.mightWrite(session, this._name))
    assertAccess(await this._accessController.mightDoAction(
      session,
      'replace',
      this._name,
    ));

    // All new attributes must be writable
    assertWritableAttributes(
      this._accessController,
      this._name,
      session,
      attributes
    );

    // Load existing document
    const existing = await this._store.read(id);
    if (!existing) {
      throw new NotFoundError();
    }

    // All existing attributes must be writable because any that are not in
    // the new attributes will be deleted.
    assertWritableAttributes(
      this._accessController,
      this._name,
      session,
      existing.attributes,
    );

    // Perform fine-grained access control on the old and new attributes
    assertAccess(await this._documentAccessController(
      session,
      this._name,
      'replace',
      attributes,
      existing.attributes,
    ));

    // Return after filtering out fields the session is not allowed to read
    return filterReadableAttributes(
      this._accessController,
      this._name,
      session,
      await this._store.replace(id, attributes),
    );
  }

  /**
   * Partially update a document.
   *
   * @param session The session performing the action.
   * @param id The ID of the document to update.
   * @param attributes Attributes to change or set.
   */
  async patch(
    session: Sess,
    id: string,
    attributes: Attrs
  ): Promise<Document<Attrs>> {
    assertAccess(this._accessController.mightWrite(session, this._name))
    assertAccess(await this._accessController.mightDoAction(
      session,
      'patch',
      this._name,
    ));

    // All the fields to change need to be writable by the session
    assertWritableAttributes(
      this._accessController,
      this._name,
      session,
      attributes
    );

    // Load existing document
    const existing = await this._store.read(id);
    if (!existing) {
      throw new NotFoundError();
    }

    // Construct new attributes
    const newAttributes = { ...existing.attributes, ...attributes };

    // Perform fine-grained access control on the old and new attributes
    assertAccess(await this._documentAccessController(
      session,
      this._name,
      'patch',
      newAttributes,
      existing.attributes,
    ));

    // Save the patched document
    const newDocument = await this._store.replace(id, newAttributes);

    // Return after filtering out fields the session is not allowed to read
    return filterReadableAttributes(
      this._accessController,
      this._name,
      session,
      newDocument,
    );
  }

  /**
   * Remove an existing document.
   *
   * @param session
   * @param id
   */
  async destroy(session: Sess, id: string): Promise<void> {
    assertAccess(this._accessController.mightWrite(session, this._name))
    assertAccess(await this._accessController.mightDoAction(
      session,
      'destroy',
      this._name,
    ));

    // Perform fine-grianed access control if the document already exists
    const existing = await this._store.read(id);
    if (!existing) {
      return;
    }
    assertAccess(await this._documentAccessController(
      session,
      this._name,
      'destroy',
      existing.attributes,
    ));

    await this._store.destroy(id);
  }

  /**
   * List existing documents.
   *
   * @param session
   * @param query
   */
  async list(session: Sess, query: any): Promise<Document<Attrs>[]> {
    assertAccess(this._accessController.mightRead(session, this._name))
    assertAccess(await this._accessController.canDoCollectionAction(
      session,
      'list',
      this._name,
    ));

    return [];
  }
}
