import express = require('express');
import { ActionArguments } from './action-arguments'
import { ApiServer } from '../server';
import { Document } from '../document';
import { Emitter } from '../emitter';
import { Resource } from '../resource';
import { Action, ActionHandler, WrappedActionHandler } from './action';
import { ForbiddenError, NotFoundError } from '../errors';

export class InstanceAction<T> extends Action<T> {
  private _autoload = true;

  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
    this._basePath = '/:id';
  }

  /**
   * Enable or disable loading of the instance before executing the handler
   * callback. Defaults to `true` for all instance actions.
   *
   * Not that setting this to `false` means
   * {@link Session#authorizeDocumentAction} will not be called as there is no
   * loaded document to authorize against, so you will rely solely on
   * {@link Session#preAuthorizeDocumentAction} for access control.
   *
   * @param value `true` or `false`.
   */
  loadsExisting(value: boolean): InstanceAction<T> {
    this._autoload = value;
    return this;
  }

  protected _createRoute(
    handler: ActionHandler<T>,
    server: ApiServer
  ): WrappedActionHandler<T> {
    if (!this._resource.initialized.hasStore) {
      throw new Error(`Resource ${this._resource.name} has no store`);
    }
    const store = this._resource.initialized.store;

    return async (
      req: express.Request,
      res: express.Response
    ): Promise<Emitter<T>> => {
      const session = await server.getSession(req);
      const params = await this._prepareRequest(server.validator, session, req);

      // TODO: Validate ID
      const id = req.params.id;
      params.id = req.params.id;

      // Initial authorization before the target document is loaded
      const isPreAuthorized = await session.preAuthorizeDocumentAction(
        this._resource,
        this._name,
        id,
        params.requestBody
      );
      if (!isPreAuthorized) {
        throw new ForbiddenError();
      }

      // Load and authorize against existing document if autoloading is enabled
      let document: Document<T>|null = null;
      if (this._autoload) {
        document = await store.read(id);
        if (document === null) {
          throw new NotFoundError();
        }
        const isAuthorized = await session.authorizeDocumentAction(
          this._resource,
          this._name,
          id,
          document,
          params.requestBody
        );
        if (!isAuthorized) {
          throw new ForbiddenError();
        }
      }
      params.existingDocument = document;

      await handler(new ActionArguments<T>(params));
      return params.emitter;
    };
  }
}
