import express = require('express');
import { ApiServer } from './server';
import { Store } from './store';
import { suffixUrlFilename } from './utils';
import { ALL_DEFAULT_ACTIONS, RESOURCE_NAME_PATTERN } from './constants';
import { CollectionAction, getDefaultActionFactories, InstanceAction } from './action';
import { createJsonApiDocumentRequestSchema, createJsonApiDocumentResponseSchema } from './json-api';
import { DefaultActionName, JsonSchema } from './types';

export class InitializedResource<T> {
  private _name: string;
  private _store: Store<T>|null;

  get name(): string {
    return this._name;
  }

  get hasStore(): boolean {
    return !!this._store;
  }

  get store(): Store<T> {
    if (!this._store) {
      throw new Error(`Resource ${this._name} has no store`);
    }
    return this._store;
  }

  constructor(name: string, store: Store<T>|null) {
    this._name = name;
    this._store = store;
  }
}

export class Resource<T = any> {
  private _name: string;
  private _slug?: string;
  private _defaultActions: DefaultActionName[] = ALL_DEFAULT_ACTIONS;
  private _initialized?: InitializedResource<T>;
  private _jsonSchemas: JsonSchema[] = [];
  private _documentSchemaId: string|null = null;
  private _collectionActions: CollectionAction<T>[] = [];
  private _instanceActions: InstanceAction<T>[] = [];
  private _store?: Store<T>;

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
    return !!this._store;
  }

  get initialized(): InitializedResource<T> {
    if (!this._initialized) {
      throw new Error(`Resource ${this._name} has not been initialized`);
    }
    return this._initialized;
  }

  constructor(name: string, schema?: JsonSchema) {
    if (!RESOURCE_NAME_PATTERN.test(name)) {
      throw new TypeError(`Invalid resource name: ${name}`);
    }
    this._name = name;

    if (schema) {
      if (!schema['$id']) {
        throw new Error('Schema has no $id');
      }
      this._documentSchemaId = schema['$id'];
      this.withSchemas(schema);
    }
  }

  async initialize(): Promise<InitializedResource<T>> {
    if (this._initialized) {
      throw new Error(`Resource ${this.name} is already initialized`);
    }

    this.withSchemas(...this.generateResponseSchemas());

    this._initialized = new InitializedResource(
      this._name,
      this._store || null,
    );

    return this._initialized;
  }

  withSlug(value: string): this {
    this._slug = value;
    return this;
  }

  /** Sets the list of default CRUD actions to create. */
  withDefaultActions(...values: DefaultActionName[]): this {
    this._defaultActions = [ ...values ];
    return this;
  }

  withStore(store: Store<T>): this {
    this._store = store;
    return this;
  }

  /** Add JSON schemas */
  withSchemas(...schemas: JsonSchema[]): this {
    this._jsonSchemas.push(...schemas);
    return this;
  }

  withCollectionAction(name: string): CollectionAction<T> {
    const action = new CollectionAction(this, name);
    this._collectionActions.push(action);
    return action;
  }

  withInstanceAction(name: string): InstanceAction<T> {
    const action = new InstanceAction(this, name);
    this._instanceActions.push(action);
    return action;
  }

  bind(server: ApiServer): express.Router {
    const router = express.Router();

    if (this._defaultActions.length > 0) {
      const defaultActionFactories = getDefaultActionFactories<T>();
      for (const actionName of this._defaultActions) {
        defaultActionFactories[actionName](this);
      }
    }

    for (const action of this._collectionActions) {
      action.bind(router, server);
    }
    for (const action of this._instanceActions) {
      action.bind(router, server);
    }

    return router;
  }

  /**
   * Generate schemas for JSON:API compliant response envelopes.
   */
  private generateResponseSchemas(): JsonSchema[] {
    if (!this._documentSchemaId) {
      return [];
    }

    const documentRequestSchema = {
      $id: this.documentRequestSchemaId,
      type: 'object',
      properties: {
        data: createJsonApiDocumentRequestSchema(
          this._documentSchemaId,
          this.slug
        ),
      },
      required: ['data'],
    };

    const collectionResponseSchema = {
      $id: this.collectionResponseSchemaId,
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: createJsonApiDocumentResponseSchema(
            this._documentSchemaId,
            this.slug
          ),
        },
        meta: {
          type: 'object',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: true,
          }
        }
      },
      required: ['data'],
      additionalProperties: false,
    };

    const documentResponseSchema = {
      $id: this.documentResponseSchemaId,
      type: 'object',
      properties: {
        data: createJsonApiDocumentResponseSchema(
          this._documentSchemaId,
          this.slug
        ),
      },
      required: ['data'],
    };

    return [
      documentRequestSchema,
      collectionResponseSchema,
      documentResponseSchema
    ];
  }
}
