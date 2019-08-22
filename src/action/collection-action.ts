import express = require('express');
import { ActionArguments } from './action-arguments';
import { Dependencies } from '../types';
import { Emitter } from '../emitter';
import { ForbiddenError } from '../errors';
import { Resource } from '../resource';
import { SessionParser } from '../session';
import { Validator } from '../validator';
import { Action, ActionHandler, WrappedActionHandler } from './action';

export class CollectionAction<T> extends Action<T> {
  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
  }

  protected _createRoute(
    handler: ActionHandler<T>,
    dependencies: Dependencies
  ): WrappedActionHandler<T> {
    if (!dependencies.validator) {
      throw new Error('Missing dependency: validator');
    }
    const validator = dependencies.validator as Validator;

    if(!dependencies.getSession) {
      throw new Error('Missing dependency: getSession');
    }
    const getSession = dependencies.getSession as SessionParser;

    return async (
      req: express.Request,
      res: express.Response
    ): Promise<Emitter<T>> => {
      const session = await getSession(req);

      const params = await this._prepareRequest(validator, session, req);

      // Authorize action
      const isAuthorized = await session.authorizeCollectionAction<T>(
        this._resource,
        this._name,
        params.requestBody
      );
      if (!isAuthorized) {
        throw new ForbiddenError();
      }

      await handler(new ActionArguments(params));
      return params.emitter;
    };
  }
}
