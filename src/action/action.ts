import express = require('express');
import * as bodyParser from 'body-parser';
import { SUPPORTED_HTTP_METHODS, METHODS_WITH_BODY } from '../constants';
import { Emitter } from '../emitter';
import { Resource } from '../resource';
import { IDependencies, HttpMethod } from '../types';
import { Session } from '../session';
import { IStore } from '../store';
import { Validator } from '../validator';

const jsonParser = bodyParser.json();

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
