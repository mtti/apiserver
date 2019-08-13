import express = require('express');
import { DefaultActionName, IDependencies } from './types';
import { IStore, StoreFactory } from './store';
import { Uuid } from './uuid';
import { ALL_DEFAULT_ACTIONS, RESOURCE_NAME_PATTERN } from './constants';
import { CollectionAction, InstanceAction } from './action';
import { UnsupportedMediaTypeError } from './errors';
import { suffixUrlFilename } from './utils';
import { getJsonApiDataEnvelopeSchema } from './json-api';

export class Resource<T = any> {
  private _name: string;
  private _slug?: string;
  private _defaultActions: DefaultActionName[] = ALL_DEFAULT_ACTIONS;
  private _storeFactory?: StoreFactory<T>;
  private _initialized?: InitializedResource<T>;
  private _jsonSchemas: object[] = [];
  private _documentSchemaId: string|null = null;
  private _collectionActions: CollectionAction<T>[] = [];
  private _instanceActions: InstanceAction<T>[] = [];

  get name(): string {
    return this._name;
  }

  get slug(): string {
    if (this._slug) {
      return this._slug;
    }
    return `${this._name}s`;
  }

  /**
   * The resource's main document schema ID.
   */
  get schemaId(): string|null {
    return this._documentSchemaId;
  }

  /**
   * Does the resource have a document schema?
   */
  get hasDocumentSchema(): boolean {
    return !!this._documentSchemaId;
  }

  get collectionResponseSchemaId(): string {
    if (!this._documentSchemaId) {
      throw new Error('No document schema ID set');
    }
    return suffixUrlFilename(this._documentSchemaId, '-collection-response');
  }

  get documentResponseSchemaId(): string {
    if (!this._documentSchemaId) {
      throw new Error('No document schema ID set');
    }
    return suffixUrlFilename(this._documentSchemaId, '-document-response');
  }

  get schemas(): object[] {
    return [...this._jsonSchemas];
  }

  get hasStore(): boolean {
    return !!this._storeFactory;
  }

  get initialized(): InitializedResource<T> {
    if (!this._initialized) {
      throw new Error(`Resource ${this._name} has not been initialized`);
    }
    return this._initialized;
  }

  constructor(name: string, schema?: any) {
    if (!RESOURCE_NAME_PATTERN.test(name)) {
      throw new TypeError(`Invalid resource name: ${name}`);
    }
    this._name = name;

    if (schema) {
      if (!schema['$id']) {
        throw new Error('Schema has not $id');
      }
      this._documentSchemaId = schema['$id'];
      this.addSchemas([ schema, ...this.generateResponseSchemas() ]);
    }
  }

  initialize(dependencies: IDependencies): InitializedResource<T> {
    if (this._initialized) {
      throw new Error(`Resource ${this.name} is already initialized`);
    }

    let store: IStore<T>|null = null;
    if (this._storeFactory) {
      store = this._storeFactory(dependencies);
    }

    this._initialized = new InitializedResource(
      this._name,
      store,
    );

    return this._initialized;
  }

  setSlug(value: string): this {
    this._slug = value;
    return this;
  }

  /** Sets the list of default CRUD actions to create. */
  setDefaultActions(...values: DefaultActionName[]): this {
    this._defaultActions = [ ...values ];
    return this;
  }

  setStore(factory: StoreFactory<T>): this {
    this._storeFactory = factory;
    return this;
  }

  /** Add JSON schemas */
  addSchemas(...schemas: object[]): this {
    this._jsonSchemas.push(...schemas);
    return this;
  }

  createCollectionAction(name: string): CollectionAction<T> {
    const action = new CollectionAction(this, name);
    this._collectionActions.push(action);
    return action;
  }

  createInstanceAction(name: string): InstanceAction<T> {
    const action = new InstanceAction(this, name);
    this._instanceActions.push(action);
    return action;
  }

  bind(dependencies: IDependencies): express.Router {
    const router = express.Router();

    if (this._defaultActions.length > 0) {
      const defaultActionFactories = getDefaultActionFactories<T>();
      for (let actionName of this._defaultActions) {
        defaultActionFactories[actionName](this);
      }
    }

    for (let action of this._collectionActions) {
      action.bind(router, dependencies);
    }
    for (let action of this._instanceActions) {
      action.bind(router, dependencies);
    }

    return router;
  }

  /**
   * Generate schemas for JSON:API compliant response envelopes.
   */
  private generateResponseSchemas(): object[] {
    if (!this._documentSchemaId) {
      return [];
    }

    const collectionResponseSchema = {
      $id: this.collectionResponseSchemaId,
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: getJsonApiDataEnvelopeSchema(this._documentSchemaId, this.slug),
        },
      },
    };

    const documentResponseSchema = {
      $id: this.documentResponseSchemaId,
      type: 'object',
      properties: {
        data: getJsonApiDataEnvelopeSchema(this._documentSchemaId, this.slug),
      }
    };

    return [collectionResponseSchema, documentResponseSchema];
  }
}

export class InitializedResource<T> {
  private _name: string;
  private _store: IStore<T>|null;

  get name(): string {
    return this._name;
  }

  get hasStore(): boolean {
    return !!this._store;
  }

  get store(): IStore<T> {
    if (!this._store) {
      throw new Error(`Resource ${this._name} has no store`);
    }
    return this._store;
  }

  constructor(name: string, store: IStore<T>|null) {
    this._name = name;
    this._store = store;
  }
}

type DefaultActionFactories<T> = {
  [K in DefaultActionName]: (resource: Resource<T>) => void;
}

export function getDefaultActionFactories<T>(): DefaultActionFactories<T> {
  return {
    create: <T>(resource: Resource<T>) => {
      resource.createCollectionAction('create')
        .hasMethod('POST')
        .hasSuffix(null)
        .handler(async ({ emit, store, body }) => {
          const id = new Uuid().toString();
          return emit.document(await store.create(id, body));
        });
    },

    read: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('read')
        .hasMethod('GET')
        .hasSuffix(null)
        .handler(async ({ document }) => document);
    },

    replace: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('replace')
        .hasMethod('PUT')
        .hasSuffix(null)
        .handler(async ({ emit, store, id, document, body }) =>
          emit.document(await store.replace(id, { ...document, ...body })));
    },

    patch: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('patch')
        .hasMethod('PATCH')
        .hasSuffix(null)
        .handler(async ({ emit, req, store, id, document, body }) => {
          // TODO: Add JSON-PATCH support
          if (req.is('application/json-patch+json')) {
            if (store.jsonPatch) {
              return emit.document(await store.jsonPatch(id, body));
            }
            throw new UnsupportedMediaTypeError('JSON PATCH is not implemented yet');
          }

          if (store.shallowUpdate) {
            return emit.document(await store.shallowUpdate(id, body));
          }

          // Do a shallow update if JSON-PATCH was no specified
          return emit.document(await store.replace(id, { ...document, ...body }));
        });
    },

    destroy: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('destroy')
        .hasMethod('DELETE')
        .hasSuffix(null)
        .handler(async ({ emit, store, id }) => {
          await store.destroy(id);
          return emit.raw({});
        });
    },

    list: <T>(resource: Resource<T>) => {
      resource.createCollectionAction('list')
        .hasMethod('GET')
        .hasSuffix(null)
        .handler(async ({ emit, store }) => emit.raw(await store.list(null)));
    },
  };
}
