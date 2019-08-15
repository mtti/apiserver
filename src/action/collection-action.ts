import express = require('express');
import { Emitter } from '../emitter';
import { ForbiddenError } from '../errors';
import { wrapHandler } from '../handler';
import { Resource } from '../resource';
import { SessionParser } from '../session';
import { IDependencies } from '../types';
import { Validator } from '../validator';
import { Action } from './action';
import { ActionArguments } from './action-arguments';

export type CollectionActionHandler<T> = (args: ActionArguments<T>) => Promise<Emitter<T>>;

export class CollectionAction<T> extends Action<T> {
  private _handler: CollectionActionHandler<T> = async ({ emit }) => emit.raw({});

  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
  }

  respondsWith(handler: CollectionActionHandler<T>): this {
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

      const params = await this._prepareRequest(validator, session, req);

      // Authorize action
      if (!(await session.authorizeCollectionAction<T>(this._resource, this._name, params.requestBody))) {
        throw new ForbiddenError();
      }

      await this._handler(new ActionArguments(params));

      return params.emitter.response;
    });
  }
}
