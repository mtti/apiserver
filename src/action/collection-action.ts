import express = require('express');
import { BadRequestError, ForbiddenError } from '../errors';
import { wrapHandler } from '../handler';
import { Resource } from '../resource';
import { SessionParser } from '../session';
import { IDependencies } from '../types';
import { Validator } from '../validator';
import { Action, ActionArguments } from './action';

export type CollectionActionHandler<T> = (args: ActionArguments<T>) => Promise<object>;

export class CollectionAction<T> extends Action<T> {
  private _handler: CollectionActionHandler<T> = async () => ({});

  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
  }

  respondsWithRaw(handler: CollectionActionHandler<T>): this {
    this.respondsWithType('raw');
    this._handler = handler;
    return this;
  }

  respondsWithDocument(handler: CollectionActionHandler<T>): this {
    this.respondsWithType('document');
    this._handler = handler;
    return this;
  }

  respondsWithCollection(handler: CollectionActionHandler<T>): this {
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
          body = await session.filterReadAttributes(this._resource, body);
        }
      }

      // Authorize action
      if (!(await session.authorizeCollectionAction(this._resource, this._name, body))) {
        throw new ForbiddenError();
      }

      const args = new ActionArguments(req, this._resource.initialized.store, body);
      const response = await this._handler(args);

      return this._finalizeResponse(session, validator, response);
    });
  }
}
