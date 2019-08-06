import express = require('express');
import { DefaultActionName, IDependencies } from './types';
import { IStore, StoreFactory } from './store';
import { Uuid } from './uuid';
import { ALL_DEFAULT_ACTIONS, RESOURCE_NAME_PATTERN } from './constants';
import { CollectionAction, InstanceAction } from './action';

export class Resource {
  private _name: string;
  private _slug?: string;
  private _defaultActions: DefaultActionName[] = ALL_DEFAULT_ACTIONS;
  private _storeFactory?: StoreFactory;
  private _initialized?: InitializedResource;
  private _jsonSchemas: object[] = [];
  private _collectionActions: CollectionAction[] = [];
  private _instanceActions: InstanceAction[] = [];

  get name(): string {
    return this._name;
  }

  get slug(): string {
    if (this._slug) {
      return this._slug;
    }
    return `${this._name}s`;
  }

  get schemas(): object[] {
    return [...this._jsonSchemas];
  }

  get hasStore(): boolean {
    return !!this._storeFactory;
  }

  get initialized(): InitializedResource {
    if (!this._initialized) {
      throw new Error(`Resource ${this._name} has not been initialized`);
    }
    return this._initialized;
  }

  constructor(name: string) {
    if (!RESOURCE_NAME_PATTERN.test(name)) {
      throw new TypeError(`Invalid resource name: ${name}`);
    }

    this._name = name;
  }

  initialize(dependencies: IDependencies): InitializedResource {
    if (this._initialized) {
      throw new Error(`Resource ${this.name} is already initialized`);
    }

    let store: IStore|null = null;
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

  setStore(factory: StoreFactory): this {
    this._storeFactory = factory;
    return this;
  }

  /** Add JSON schemas */
  addSchemas(...schemas: object[]): this {
    this._jsonSchemas.push(...schemas);
    return this;
  }

  createCollectionAction(name: string): CollectionAction {
    const action = new CollectionAction(this, name);
    this._collectionActions.push(action);
    return action;
  }

  createInstanceAction(name: string): InstanceAction {
    const action = new InstanceAction(this, name);
    this._instanceActions.push(action);
    return action;
  }

  bind(dependencies: IDependencies): express.Router {
    const router = express.Router();

    for (let actionName of this._defaultActions) {
      defaultActionFactories[actionName](this);
    }

    for (let action of this._collectionActions) {
      action.bind(router, dependencies);
    }
    for (let action of this._instanceActions) {
      action.bind(router, dependencies);
    }

    return router;
  }
}

export class InitializedResource {
  private _name: string;
  private _store: IStore|null;

  get name(): string {
    return this._name;
  }

  get hasStore(): boolean {
    return !!this._store;
  }

  get store(): IStore {
    if (!this._store) {
      throw new Error(`Resource ${this._name} has no store`);
    }
    return this._store;
  }

  constructor(name: string, store: IStore|null) {
    this._name = name;
    this._store = store;
  }
}

interface IDefaultActionFactories {
  [name: string]: (resource: Resource) => void;
}

const defaultActionFactories: IDefaultActionFactories = {
  create: (resource: Resource) => {
    resource.createCollectionAction('create')
      .setMethod('POST')
      .setSuffix(null)
      .respondsWithDocument(async ({ store, body }) => {
        const id = new Uuid().toString();
        return store.create(id, body);
      });
  },

  read: (resource: Resource) => {
    resource.createInstanceAction('read')
      .setMethod('GET')
      .setSuffix(null)
      .respondsWithDocument(async ({ document }) => document);
  },

  update: (resource: Resource) => {
    resource.createInstanceAction('update')
      .setMethod('PUT')
      .setSuffix(null)
      .respondsWithDocument(async ({ store, id, document, body }) => store.update(id, { ...document, ...body }));
  },

  destroy: (resource: Resource) => {
    resource.createInstanceAction('destroy')
      .setMethod('DELETE')
      .setSuffix(null)
      .respondsWithDocument(async ({ store, id }) => store.destroy(id));
  },

  list: (resource: Resource) => {
    resource.createCollectionAction('list')
      .setMethod('GET')
      .setSuffix(null)
      .respondsWithCollection(async ({ store }) => store.list(null));
  },
}
