import express = require('express');
import * as bodyParser from 'body-parser';
import { IStore } from './store';
import { Validator } from './validator';
import { Resource } from './resource';
import { BadRequestError, NotFoundError, ForbiddenError } from './errors';
import { Session, SessionParser } from './session';
import { wrapHandler } from './handler';
import { SUPPORTED_HTTP_METHODS, METHODS_WITH_BODY } from './constants';
import { HttpMethod, IDependencies } from './types';
import { Emitter } from './emitter';

const jsonParser = bodyParser.json();

export type ActionResponseType = 'raw' | 'document' | 'collection';

export const ACTION_RESPONSE_TYPES: ActionResponseType[] = [ 'raw', 'document', 'collection' ];

export type CollectionActionHandler<T> = (args: ActionArguments<T>) => Promise<Emitter>;

export type InstanceActionHandler<T> = (args: InstanceActionArguments<T>) => Promise<Emitter>;

export interface IActionBindParameters<T> {
  store: IStore<T>;
  validator: Validator;
}

export class ActionArguments<T> {
  private _req: express.Request;
  private _store?: IStore<T>;
  private _emitter: Emitter;
  private _body?: any;

  get req(): express.Request {
    return this._req;
  }

  get store(): IStore<T> {
    if (!this._store) {
      throw new Error('No store');
    }
    return this._store;
  }

  get emit(): Emitter {
    return this._emitter;
  }

  get body(): any {
    if (!this._body) {
      throw new Error('No body');
    }
    return this._body;
  }

  constructor(req: express.Request, store: IStore<T>|null, emitter:Emitter, body: any|null) {
    if (!req) {
      throw new Error('req is required');
    }
    this._req = req;

    if (store) {
      this._store = store;
    }

    this._emitter = emitter;

    if (body) {
      this._body = body;
    }
  }
}

export class InstanceActionArguments<T> extends ActionArguments<T> {
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

  constructor(req: express.Request, store: IStore<T>|null, id: string, document: any|null, emitter: Emitter, body: any|null) {
    super(req, store, emitter, body);
    this._id = id;
    this._document = document;
  }
}

/** Base class for collection and instance actions */
export abstract class Action<T> {
  protected _resource: Resource<T>;
  protected _name: string;
  protected _method: HttpMethod = 'POST';
  protected _hasRequestBody: boolean = true;
  protected _requestContract?: string;
  protected _responseContract?: string;
  protected _requestIsDocument: boolean = true;
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

  constructor(resource: Resource<T>, name: string) {
    this._resource = resource;
    this._name = name;
    this._suffix = name;
  }

  /**
   * Set the action's HTTP method.
   *
   * @param method One of `GET`, `POST`, `PUT`, `PATCH` or `DELETE`-
   */
  hasMethod(method: HttpMethod): this {
    if (!SUPPORTED_HTTP_METHODS.includes(method)) {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    this._method = method;
    this._hasRequestBody = METHODS_WITH_BODY.includes(method);

    return this;
  }

  /**
   * Set the action's path suffix.
   *
   * @param value The path suffix or `null` for no suffix
   */
  hasSuffix(value: string|null): this {
    if (value) {
      if (value.includes('/')) {
        throw new Error('Suffix can not contain a slash');
      }
    }

    this._suffix = value;
    return this;
  }

  /**
   * Set whether the action receives a request body. This is enabled by default if the action's
   * HTTP method is set to `POST`, `PUT` or `PATCH`.
   *
   * @param value `true` or `false`
   */
  receivesBody(value: boolean = true): this {
    this._hasRequestBody = value;
    return this;
  }

  /**
   * Set the JSON schema to validate incoming request bodies.
   *
   * @param value JSON schema reference
   */
  validatesRequestWith(value: string): this {
    this._requestContract = value;
    return this;
  }

  /**
   * Set the JSON schema used to validate outgoing responses.
   *
   * @param value JSON schema reference
   */
  validatesResponseWith(value: string): this {
    this._responseContract = value;
    return this;
  }

  /**
   * Set whether the action receives a document. If it does, the request body is automatically
   * filtered with `Session.filterRequestFields` to remove fields which the user is not authorized
   * to write. Has no effect if the action has been configured not to receive a request body.
   * Defaults to `true`.
   *
   * @param value `true` or `false`
   */
  receivesDocument(value: boolean = true): this {
    this._requestIsDocument = value;
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
    // If a response contract is specified, make sure the response conforms to it
    if (this._responseContract) {
      validator.assertResponse(this._responseContract, response);
    }

    return response;
  }
}

export class CollectionAction<T> extends Action<T> {
  private _handler: CollectionActionHandler<T> = async ({ emit }) => emit.raw({});

  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
  }

  handler(handler: CollectionActionHandler<T>): this {
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
      if (!(await session.preAuthorizeResource(this._resource))) {
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
          body = await session.filterReadAttributes(this._resource, body);
        }
      }

      // Authorize action
      if (!(await session.authorizeCollectionAction(this._resource, this._name, body))) {
        throw new ForbiddenError();
      }

      const emitter = new Emitter(this._resource, session);
      const args = new ActionArguments(req, this._resource.initialized.store, emitter, body);
      await this._handler(args);

      return this._finalizeResponse(session, validator, emitter.response);
    });
  }
}

export class InstanceAction<T> extends Action<T> {
  private _handler: InstanceActionHandler<T> = async ({ emit }) => emit.raw({});
  private _autoload: boolean = true;

  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
    this._basePath = '/:id';
  }

  handler(handler: InstanceActionHandler<T>): this {
    this._handler = handler;
    return this;
  }

  /**
   * Enable or disable loading of the instance before executing the handler callback. Defaults
   * to `true` for all instance actions.
   *
   * Not that setting this to `false` means {@link Session#authorizeDocumentAction} will not be
   * called as there is no loaded document to authorize against, so you will rely solely on
   * {@link Session#preAuthorizeDocumentAction} for access control.
   *
   * @param value `true` or `false`.
   */
  loadsExisting(value: boolean): InstanceAction<T> {
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
      if (!(await session.preAuthorizeResource(this._resource))) {
        throw new ForbiddenError();
      }

      let body: any = null;
      if (this._hasRequestBody) {
        body = req.body;

        if (this._requestContract) {
          validator.assertRequestBody<any>(this._requestContract, body);
        }

        if (this._requestIsDocument) {
          body = await session.filterReadAttributes(this._resource, body);
        }
      }

      // Initial authorization before the target document is loaded
      if (!(await session.preAuthorizeDocumentAction(this._resource, this._name, id, body))) {
        throw new ForbiddenError();
      }

      let document: object|null = null;
      if (this._autoload) {
        document = await store.read(id);
        if (document === null) {
          throw new NotFoundError();
        }

        if (!(await session.authorizeDocumentAction(this._resource, this._name, id, document, body))) {
          throw new ForbiddenError();
        }
      }

      const emitter = new Emitter(this._resource, session);
      await this._handler(new InstanceActionArguments(
        req,
        this._resource.initialized.store,
        id.toString(),
        document,
        emitter,
        body
      ));
      return this._finalizeResponse(session, validator, emitter.response);
    });
  }
}
