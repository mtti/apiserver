import express = require('express');
import { CollectionAction, getDefaultActionFactories, InstanceAction } from './action';
import { ALL_DEFAULT_ACTIONS, RESOURCE_NAME_PATTERN } from './constants';
import { createJsonApiDocumentResponseSchema, createJsonApiDocumentRequestSchema } from './json-api';
import { IStore, StoreFactory } from './store';
import { DefaultActionName, IDependencies } from './types';
import { suffixUrlFilename } from './utils';

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

  get documentRequestSchemaId(): string {
    if (!this._documentSchemaId) {
      throw new Error('No document schema ID set');
    }
    return suffixUrlFilename(this._documentSchemaId, '-document-request');
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
      this.addSchemas([ schema ]);
    }
  }

  initialize(dependencies: IDependencies): InitializedResource<T> {
    if (this._initialized) {
      throw new Error(`Resource ${this.name} is already initialized`);
    }

    this.addSchemas([ ...this.generateResponseSchemas() ]);

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

    const documentRequestSchema = {
      $id: this.documentRequestSchemaId,
      type: 'object',
      properties: {
        data: createJsonApiDocumentRequestSchema(this._documentSchemaId, this.slug),
      }
    };

    const collectionResponseSchema = {
      $id: this.collectionResponseSchemaId,
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: createJsonApiDocumentResponseSchema(this._documentSchemaId, this.slug),
        },
      },
    };

    const documentResponseSchema = {
      $id: this.documentResponseSchemaId,
      type: 'object',
      properties: {
        data: createJsonApiDocumentResponseSchema(this._documentSchemaId, this.slug),
      }
    };

    return [documentRequestSchema, collectionResponseSchema, documentResponseSchema];
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
