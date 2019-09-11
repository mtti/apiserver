import express = require('express');
import { ActionArguments } from './action-arguments';
import { ApiServer } from '../server';
import { Emitter } from '../emitter';
import { ForbiddenError } from '../errors';
import { Resource } from '../resource';
import { Action, ActionHandler, WrappedActionHandler } from './action';

export class CollectionAction<T> extends Action<T> {
  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
  }

  protected _createRoute(
    handler: ActionHandler<T>,
    server: ApiServer
  ): WrappedActionHandler<T> {
    return async (req: express.Request): Promise<Emitter<T>> => {
      const session = await server.getSession(req);
      const params = await this._prepareRequest(server.validator, session, req);

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
