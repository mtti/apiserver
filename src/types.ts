import express = require('express');
import { Uuid } from './uuid';
import { IStore } from './store';

export type SessionParser = (req: express.Request) => Promise<any>;

/** Raw document */
export interface IDocument {
  [name: string]: any;
}

/** Promisified request handler. */
export type WrappedRequestHandler = (req: express.Request, res: express.Response) => Promise<any>;

export type DefaultActionName = 'create' | 'read' | 'update' | 'destroy' | 'list';

export const ALL_DEFAULT_ACTIONS = ['create', 'read', 'update', 'destroy', 'list'];

export type DefaultActionFactory = (router: express.Router, store: IStore) => void;

export interface DefaultActionMap {
  [name: string]: DefaultActionFactory
}

export type InstanceActionHandler = (instance: any, req: express.Request, res: express.Response) => Promise<any>;

export interface InstanceActionMap {
  [name: string]: InstanceActionHandler;
}

export type InstanceActionFactory = (dependencies: IDependencies) => InstanceActionMap;

export type CollectionActionHandler = (req: express.Request, res: express.Response) => Promise<any>;

export interface CollectionActionMap {
  [name: string]: CollectionActionHandler;
}

export type CollectionActionFactory = (dependencies: IDependencies) => CollectionActionMap;

/** Interface for the dependency injection container. */
export interface IDependencies {
  [name: string]: any;
}

/** Callback for filtering instance fields based on user permissions */
export type DocumentFieldFilter = (session: any, action: string, id: string, document: IDocument) => Promise<IDocument>;

/** Default instance field filter which allows all access. */
export const defaultFieldFilter: DocumentFieldFilter
  = async (session: any, action: string, id: string, document: IDocument) => ({ ...document });
