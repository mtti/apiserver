import express = require('express');
import { IDocument } from '../document';
import { Emitter } from '../emitter';
import { ForbiddenError, NotFoundError } from '../errors';
import { wrapHandler } from '../handler';
import { Resource } from '../resource';
import { SessionParser } from '../session';
import { IDependencies } from '../types';
import { Validator } from '../validator';
import { Action, ActionHandler } from './action';
import { ActionArguments } from './action-arguments'

export class InstanceAction<T> extends Action<T> {
  private _autoload = true;

  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
    this._basePath = '/:id';
  }

  /**
   * Enable or disable loading of the instance before executing the handler callback. Defaults
   * to `true` for all instance actions.
   *
   * Not that setting this to `false` means {@link Session#authorizeDocumentAction} will not be
   * called as there is no loaded document to authorize against, so you will rely solely on
   * {@link Session#preAuthorizeDocumentAction} for access control.
   *
   * @param value `true` or `false`.
   */
  loadsExisting(value: boolean): InstanceAction<T> {
    this._autoload = value;
    return this;
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

    if (!this._resource.initialized.hasStore) {
      throw new Error(`Resource ${this._resource.name} has no store`);
    }
    const store = this._resource.initialized.store;

    return async (req: express.Request, res: express.Response) => {
      const session = await getSession(req);
      const params = await this._prepareRequest(validator, session, req);

      // TODO: Validate ID
      const id = req.params.id;
      params.id = req.params.id;

      // Initial authorization before the target document is loaded
      if (!(await session.preAuthorizeDocumentAction(this._resource, this._name, id, params.requestBody))) {
        throw new ForbiddenError();
      }

      // Load and authorize against existing document if autoloading is enabled
      let document: IDocument<T>|null = null;
      if (this._autoload) {
        document = await store.read(id);
        if (document === null) {
          throw new NotFoundError();
        }
        if (!(await session.authorizeDocumentAction(this._resource, this._name, id, document, params.requestBody))) {
          throw new ForbiddenError();
        }
      }
      params.existingDocument = document;

      await handler(new ActionArguments<T>(params));
      return params.emitter;
    };
  }
}
