import express = require('express');
import { Emitter } from '../emitter';
import { ForbiddenError, NotFoundError } from '../errors';
import { wrapHandler } from '../handler';
import { Resource } from '../resource';
import { SessionParser } from '../session';
import { IStore } from '../store';
import { IDependencies } from '../types';
import { Validator } from '../validator';
import { Action, ActionArguments } from './action';

export type InstanceActionHandler<T> = (args: InstanceActionArguments<T>) => Promise<Emitter>;

export class InstanceActionArguments<T> extends ActionArguments<T> {
  private _id: string;
  private _document?: any;

  get id(): string {
    return this._id;
  }

  get document(): any {
    if (!this._document) {
      throw new Error('No document');
    }
    return this._document;
  }

  constructor(req: express.Request, store: IStore<T>|null, id: string, document: any|null, emitter: Emitter, body: any|null) {
    super(req, store, emitter, body);
    this._id = id;
    this._document = document;
  }
}

export class InstanceAction<T> extends Action<T> {
  private _handler: InstanceActionHandler<T> = async ({ emit }) => emit.raw({});
  private _autoload: boolean = true;

  constructor(resource: Resource<T>, name: string) {
    super(resource, name);
    this._basePath = '/:id';
  }

  handler(handler: InstanceActionHandler<T>): this {
    this._handler = handler;
    return this;
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

  protected _createRoute(dependencies: IDependencies) {
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

    return wrapHandler(async (req: express.Request, res: express.Response) => {
      const id = req.params.id;
      const session = await getSession(req);

      // Authorize general access to the collection
      if (!(await session.preAuthorizeResource(this._resource))) {
        throw new ForbiddenError();
      }

      let body: any = null;
      if (this._hasRequestBody) {
        body = req.body;

        if (this._requestContract) {
          validator.assertRequestBody<any>(this._requestContract, body);
        }

        if (this._requestIsDocument) {
          body = await session.filterReadAttributes(this._resource, body);
        }
      }

      // Initial authorization before the target document is loaded
      if (!(await session.preAuthorizeDocumentAction(this._resource, this._name, id, body))) {
        throw new ForbiddenError();
      }

      let document: object|null = null;
      if (this._autoload) {
        document = await store.read(id);
        if (document === null) {
          throw new NotFoundError();
        }

        if (!(await session.authorizeDocumentAction(this._resource, this._name, id, document, body))) {
          throw new ForbiddenError();
        }
      }

      const emitter = new Emitter(this._resource, session);
      await this._handler(new InstanceActionArguments(
        req,
        this._resource.initialized.store,
        id.toString(),
        document,
        emitter,
        body
      ));
      return this._finalizeResponse(session, validator, emitter.response);
    });
  }
}
