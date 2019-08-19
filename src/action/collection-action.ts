import express = require('express');
import { ForbiddenError } from '../errors';
import { Resource } from '../resource';
import { SessionParser } from '../session';
import { IDependencies } from '../types';
import { Validator } from '../validator';
import { Action, ActionHandler } from './action';
import { ActionArguments } from './action-arguments';

export class CollectionAction<T> extends Action<T> {
  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
  }

  protected _createRoute(handler: ActionHandler<T>, dependencies: IDependencies) {
    if (!dependencies.validator) {
      throw new Error('Missing dependency: validator');
    }
    const validator = dependencies.validator as Validator;

    if(!dependencies.getSession) {
      throw new Error('Missing dependency: getSession');
    }
    const getSession = dependencies.getSession as SessionParser;

    return async (req: express.Request, res: express.Response) => {
      const session = await getSession(req);

      const params = await this._prepareRequest(validator, session, req);

      // Authorize action
      if (!(await session.authorizeCollectionAction<T>(this._resource, this._name, params.requestBody))) {
        throw new ForbiddenError();
      }

      await handler(new ActionArguments(params));
      return params.emitter;
    };
  }
}
