import express = require('express');
import * as bodyParser from 'body-parser';
import { SUPPORTED_HTTP_METHODS, METHODS_WITH_BODY } from '../constants';
import { RequestDocument } from '../document';
import { Emitter } from '../emitter';
import { BadRequestError, ForbiddenError } from '../errors';
import { JsonApiRequestEnvelope } from '../json-api';
import { Resource } from '../resource';
import { IDependencies, HttpMethod } from '../types';
import { Session } from '../session';
import { Validator } from '../validator';
import { ActionArgumentParams } from './action-arguments';

const jsonParser = bodyParser.json();

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
    } else if (this._method === 'PATCH') {
      router.patch(routePath, ...handlers);
    } else if (this._method === 'DELETE') {
      router.delete(routePath, ...handlers);
    }
  }

  /**
   * Create the action's express handler.
   *
   * @param dependencies
   */
  protected abstract _createRoute(dependencies: IDependencies): express.RequestHandler;

  /**
   * Perform some prepartions and validation common to both collection and instance actions.
   *
   * @param validator
   * @param session
   * @param req
   */
  protected async _prepareRequest(
    validator: Validator,
    session: Session,
    req: express.Request
  ): Promise<ActionArgumentParams<T>> {
    // Authorize general access to the collection
    if (!(await session.preAuthorizeResource(this._resource))) {
      throw new ForbiddenError();
    }

    let requestBody: object|null = null;
    let requestDocument: RequestDocument<T>|null = null;
    if (this._hasRequestBody) {
      if (!req.body) {
        throw new BadRequestError('Missing request body');
      }
      requestBody = req.body;

      if (this._requestIsDocument) {
        // Always validate against the resource's document request schema when the action expects
        // to receive a document.
        const envelope = validator.assertRequestBody<JsonApiRequestEnvelope<T>>(
          this._resource.documentRequestSchemaId,
          requestBody
        );

        requestDocument = envelope.data;

        // Type in JSON:API document must match resource slug
        if (requestDocument.type !== this._resource.slug) {
          throw new BadRequestError(
            `Document is '${requestDocument.type}', expected '${this._resource.slug}'`
          );
        }

        // All attributes in an incoming document must be writable by the session
        requestDocument.attributes
          = await session.filterWriteAttributes<T>(this._resource, requestDocument.attributes);
      } else if (this._requestContract) {
        // Action expects something other than a document, so validate agains a custom request
        // contract if one is specified.
        requestBody = validator.assertRequestBody<object>(this._requestContract, requestBody);
      }
    }

    const emitter = new Emitter<T>(validator, this._resource, session);
    return {
      store: this._resource.initialized.store,
      emitter,
      req,
      requestBody,
      requestDocument,
    };
  }
}
