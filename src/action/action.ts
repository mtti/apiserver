import express = require('express');
import * as bodyParser from 'body-parser';
import { ACTION_RESPONSE_TYPES, SUPPORTED_HTTP_METHODS, METHODS_WITH_BODY } from '../constants';
import { Resource } from '../resource';
import { ActionResponseType, IDependencies, HttpMethod } from '../types';
import { Session } from '../session';
import { IStore } from '../store';
import { Validator } from '../validator';

const jsonParser = bodyParser.json();

export class ActionArguments<T> {
  private _req: express.Request;
  private _store?: IStore<T>;
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

  get body(): any {
    if (!this._body) {
      throw new Error('No body');
    }
    return this._body;
  }

  constructor(req: express.Request, store: IStore<T>|null, body: any|null) {
    if (!req) {
      throw new Error('req is required');
    }
    this._req = req;

    if (store) {
      this._store = store;
    }

    if (body) {
      this._body = body;
    }
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
  protected _responseFilter: ActionResponseType = 'document';

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
    // If a response contract is specified, make sure the response conforms to it
    if (this._responseContract) {
      validator.assertResponse(this._responseContract, response);
    }

    let filtered: object = { ...response };

    // If this an individual document or a collection, filter out fields the session is not allowed
    // to read.
    if (this._responseFilter === 'document') {
      filtered = await session.filterReadAttributes(this._resource, response);
    } else if (this._responseFilter === 'collection') {
      filtered = await session.filterCollectionResponse(this._resource, response);
    }

    return filtered;
  }
}
