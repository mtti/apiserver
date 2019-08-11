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

const jsonParser = bodyParser.json();

export type ActionResponseType = 'raw' | 'document' | 'collection';

export const ACTION_RESPONSE_TYPES: ActionResponseType[] = [ 'raw', 'document', 'collection' ];

export type CollectionActionHandler = (args: ActionArguments) => Promise<object>;

export type InstanceActionHandler = (args: InstanceActionArguments) => Promise<object>;

export interface IActionBindParameters {
  store: IStore;
  validator: Validator;
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
    if (body) {
      this._body = body;
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
  protected _responseFilter: ActionResponseType = 'document';
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

  /**
   * Set the action's response type. This affects what kind of automatic filtering is applied
   * to the object returned by the handler.
   *
   * For `raw`, no filtering is done.
   *
   * For `document`, all first-level fields are filtered with `Session.filterDocumentResponse` to
   * omit any fields that the user is not authorized to read. This is the default.
   *
   * For `collection`, the returned object is assumed to contain zero or more documents indexed
   * by their primary key and each first-level value will be filtered as a `document`.
   *
   * @param value The type of object the action sends in response to requests. One of `raw`,
   * `collection` or `document`. Defaults to `document`.
   */
  respondsWithType(value: ActionResponseType): this {
    if (!ACTION_RESPONSE_TYPES.includes(value)) {
      throw new TypeError(
        `Invalid action response type: ${value}, must be one of ${ACTION_RESPONSE_TYPES.join(',')}`
      );
    }
    this._responseFilter = value;
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
    // If this an individual document or a collection, filter out fields the session is not allowed
    // to read.
    if (this._responseFilter === 'document') {
      response = await session.filterDocumentResponse(this._resource, response);
    } else if (this._responseFilter === 'collection') {
      response = await session.filterCollectionResponse(this._resource, response);
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

  respondsWithRaw(handler: CollectionActionHandler): this {
    this.respondsWithType('raw');
    this._handler = handler;
    return this;
  }

  respondsWithDocument(handler: CollectionActionHandler): this {
    this.respondsWithType('document');
    this._handler = handler;
    return this;
  }

  respondsWithCollection(handler: CollectionActionHandler): this {
    this.respondsWithType('collection');
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
          body = await session.filterDocumentRequest(this._resource, body);
        }
      }

      // Authorize action
      if (!(await session.authorizeCollectionAction(this._resource, this._name, body))) {
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

  respondsWithRaw(handler: InstanceActionHandler): this {
    this.respondsWithType('raw');
    this._handler = handler;
    return this;
  }

  respondsWithDocument(handler: InstanceActionHandler): this {
    this.respondsWithType('document');
    this._handler = handler;
    return this;
  }

  respondsWithCollection(handler: InstanceActionHandler): this {
    this.respondsWithType('collection');
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
          body = await session.filterDocumentRequest(this._resource, body);
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
