import express = require('express');
import { Uuid } from './uuid';
import { IStore } from './store';

/** Promisified request handler. */
export type WrappedRequestHandler = (req: express.Request, res: express.Response) => Promise<any>;

export type ControllerFactory = (dependencies: IDependencies) => IController;

export type DefaultActionName = 'create' | 'read' | 'update' | 'destroy' | 'list';

export const ALL_DEFAULT_ACTIONS = ['create', 'read', 'update', 'destroy', 'list'];

export type DefaultActionFactory = (router: express.Router, store: IStore) => void;

export interface DefaultActionMap {
  [name: string]: DefaultActionFactory
}

export type InstanceActionHandler = (instance: any, req: express.Request, res: express.Response) => Promise<any>;

export type CollectionActionHandler = (req: express.Request, res: express.Response) => Promise<any>;

export interface IController {
  defaultActions?: DefaultActionName[];

  collectionActions?: {
    [name: string]: CollectionActionHandler;
  }

  instanceActions?: {
    [name: string]: InstanceActionHandler;
  }
}

/** Interface for the dependency injection container. */
export interface IDependencies {
  [name: string]: any;
}

/*
export interface IStoreConstructor {
  new (dependencies: IDependencies): IStore;
}
*/
