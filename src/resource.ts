import express = require('express');
import * as bodyParser from 'body-parser';
import { IDependencies } from './types';
import { IStore, StoreFactory } from './store';
import { wrapHandler } from './handler';
import { Uuid } from './uuid';
import { BadRequestError, NotFoundError, ForbiddenError } from './errors';
import { Validator } from './validator';
import { Session, SessionParser } from './session';

const jsonParser = bodyParser.json();

export const RESOURCE_NAME_PATTERN = /^[a-z\-]+$/i

export type DefaultActionName = 'create' | 'read' | 'update' | 'destroy' | 'list';

export const ALL_DEFAULT_ACTIONS: DefaultActionName[] = ['create', 'read', 'update', 'destroy', 'list'];

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const SUPPORTED_HTTP_METHODS: HttpMethod[] = [ 'GET', 'POST', 'PUT', 'DELETE' ];

const METHODS_WITH_BODY: HttpMethod[] = ['POST', 'PUT'];

export type CollectionActionHandler = (args: ActionArguments) => Promise<object>;

export type InstanceActionHandler = (args: InstanceActionArguments) => Promise<object>;

export interface IActionBindParameters {
  store: IStore;
  validator: Validator;
}

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

export class ActionArguments {
  private _store?: IStore;
  private _body?: any;

  get store(): IStore {
    if (!this._store) {
      throw new Error('No store');
    }
    return this._store;
  }

  get body(): any {
    if (!this._body) {
      throw new Error('No body');
    }
    return this._body;
  }

  constructor(store: IStore|null, body: any|null) {
    if (store) {
      this._store = store;
    }
  }
}

export class InstanceActionArguments extends ActionArguments {
  private _id: string;
  private _document?: any;

  get id(): string {
    return this._id;
  }

  get document(): any {
    if (!this._document) {
      throw new Error('No document');
    }
    return this._document;
  }

  constructor(store: IStore|null, id: string, document: any|null, body: any|null) {
    super(store, body);
    this._id = id;
    this._document = document;
  }
}

/** Base class for collection and instance actions */
export abstract class Action {
  protected _resource: Resource;
  protected _name: string;
  protected _method: HttpMethod = 'POST';
  protected _hasRequestBody: boolean = true;
  protected _requestContract?: string;
  protected _responseContract?: string;
  protected _requestIsDocument: boolean = true;
  protected _responseIsDocument: boolean = true;
  protected _basePath: string = '/';
  protected _suffix: string | null = null;

  get path(): string {
    let result = this._basePath;

    if (this._suffix) {
      if (!result.endsWith('/')) {
        result = `${result}/`;
      }
      result = `${result}${this._suffix}`;
    }

    return result;
  }

  constructor(resource: Resource, name: string) {
    this._resource = resource;
    this._name = name;
    this._suffix = name;
  }

  /** Assign this action's HTTP method */
  setMethod(method: HttpMethod): this {
    if (!SUPPORTED_HTTP_METHODS.includes(method)) {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    this._method = method;
    this._hasRequestBody = METHODS_WITH_BODY.includes(method);

    return this;
  }

  /** Set this action's path suffix */
  setSuffix(value: string|null): this {
    if (value) {
      if (value.includes('/')) {
        throw new Error('Suffix can not contain a slash');
      }
    }

    this._suffix = value;
    return this;
  }

  setHasRequestBody(value: boolean): this {
    this._hasRequestBody = value;
    return this;
  }

  setRequestContract(value: string): this {
    this._requestContract = value;
    return this;
  }

  setResponseContract(value: string): this {
    this._responseContract = value;
    return this;
  }

  setRequestIsDocument(value: boolean): this {
    this._requestIsDocument = value;
    return this;
  }

  setResponseIsDocument(value: boolean): this {
    this._responseIsDocument = value;
    return this;
  }

  /** Bind the action to an express router */
  bind(router: express.Router, dependencies: IDependencies) {
    const routePath = this.path;

    const handlers: express.RequestHandler[] = [];
    if (this._hasRequestBody) {
      handlers.push(jsonParser);
    }
    handlers.push(this._createRoute(dependencies));

    if (this._method === 'GET') {
      router.get(routePath, ...handlers);
    } else if (this._method === 'POST') {
      router.post(routePath, ...handlers);
    } else if (this._method === 'PUT') {
      router.put(routePath, ...handlers);
    } else if (this._method === 'DELETE') {
      router.delete(routePath, ...handlers);
    }
  }

  protected abstract _createRoute(dependencies: IDependencies): express.RequestHandler;

  protected async _finalizeResponse(session: Session, validator: Validator, response: object): Promise<object> {
    // Filter out fields session is not allowed to read
    if (this._responseIsDocument) {
      if (Array.isArray(response)) {
        response = await Promise.all(response.map(item => session.filterResponseFields(this._resource, item)));
      } else {
        response = await session.filterResponseFields(this._resource, response);
      }
    }

    // If a response contract is specified, make sure the response conforms to it
    if (this._responseContract) {
      validator.assertResponse(this._responseContract, response);
    }

    return response;
  }
}

export class CollectionAction extends Action {
  private _handler: CollectionActionHandler = async () => ({});

  constructor(resource: Resource, name: string) {
    super(resource, name);
  }

  setHandler(handler: CollectionActionHandler): this {
    this._handler = handler;
    return this;
  }

  protected _createRoute(dependencies: IDependencies) {
    if (!dependencies.validator) {
      throw new Error('Missing dependency: validator');
    }
    const validator = dependencies.validator as Validator;

    if(!dependencies.getSession) {
      throw new Error('Missing dependency: getSession');
    }
    const getSession = dependencies.getSession as SessionParser;

    return wrapHandler(async (req: express.Request, res: express.Response) => {
      const session = await getSession(req);

      // Authorize general access to the collection
      if (!(await session.canAccessResource(this._resource))) {
        throw new ForbiddenError();
      }

      let body: object|null = null;
      if (this._hasRequestBody) {
        body = req.body;
        if (!body) {
          throw new BadRequestError('Missing request body');
        }

        if (this._requestContract) {
          body = validator.assertRequestBody<object>(this._requestContract, body);
        }

        if (this._requestIsDocument) {
          body = session.filterRequestFields(this._resource, body);
        }
      }

      // Authorize action
      if (!(await session.canPerformCollectionAction(this._resource, this._name, body))) {
        throw new ForbiddenError();
      }

      const args = new ActionArguments(this._resource.initialized.store, body);
      let result = await this._handler(args);

      return this._finalizeResponse(session, validator, result);
    });
  }
}

export class InstanceAction extends Action {
  private _handler: InstanceActionHandler = async () => ({});
  private _autoload: boolean = true;

  constructor(resource: Resource, name: string) {
    super(resource, name);
    this._basePath = '/:id';
  }

  /** Set the action's handler callback */
  setHandler(handler: InstanceActionHandler): InstanceAction {
    this._handler = handler;
    return this;
  }

  /** Enable or disable loading of the instance before executing the handler callback */
  autoload(value: boolean): InstanceAction {
    this._autoload = value;
    return this;
  }

  protected _createRoute(dependencies: IDependencies) {
    if (!dependencies.validator) {
      throw new Error('Missing dependency: validator');
    }
    const validator = dependencies.validator as Validator;

    if(!dependencies.getSession) {
      throw new Error('Missing dependency: getSession');
    }
    const getSession = dependencies.getSession as SessionParser;

    if (!this._resource.initialized.hasStore) {
      throw new Error(`Resource ${this._resource.name} has no store`);
    }
    const store = this._resource.initialized.store;

    return wrapHandler(async (req: express.Request, res: express.Response) => {
      const id = req.params.id;
      const session = await getSession(req);

      // Authorize general access to the collection
      if (!(await session.canAccessResource(this._resource))) {
        throw new ForbiddenError();
      }

      let body: any = null;
      if (this._hasRequestBody) {
        body = req.body;

        if (this._requestContract) {
          validator.assertRequestBody<any>(this._requestContract, body);
        }

        if (this._requestIsDocument) {
          body = session.filterRequestFields(this._resource, body);
        }
      }

      // Initial authorization before the target document is loaded
      if (!(await session.mightPerformDocumentAction(this._resource, this._name, id, body))) {
        throw new ForbiddenError();
      }

      let document: object|null = null;
      if (this._autoload) {
        document = store.read(id);
        if (document === null) {
          throw new NotFoundError();
        }

        if (!(await session.canPerformDocumentAction(this._resource, this._name, id, document, body))) {
          throw new ForbiddenError();
        }
      }

      let result: object = await this._handler(new InstanceActionArguments(
        this._resource.initialized.store,
        id.toString(),
        document,
        body
      ));

      return this._finalizeResponse(session, validator, result);
    });
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
      .setHandler(async ({ store, body }) => {
        const id = new Uuid().toString();
        return store.create(id, body);
      });
  },

  read: (resource: Resource) => {
    resource.createInstanceAction('read')
      .setMethod('GET')
      .setSuffix(null)
      .setHandler(async ({ document }) => document);
  },

  update: (resource: Resource) => {
    resource.createInstanceAction('update')
      .setMethod('PUT')
      .setSuffix(null)
      .setHandler(async ({ store, id, document, body }) => store.update(id, { ...document, ...body }));
  },

  destroy: (resource: Resource) => {
    resource.createInstanceAction('destroy')
      .setMethod('DELETE')
      .setSuffix(null)
      .setHandler(async ({ store, id }) => store.destroy(id));
  },

  list: (resource: Resource) => {
    resource.createCollectionAction('list')
      .setMethod('GET')
      .setSuffix(null)
      .setHandler(async () => []);
  },
}
