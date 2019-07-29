import express = require('express');
import { IStore } from './store';
import { IDependencies, DefaultActionName, DocumentFieldFilter, InstanceActionFactory, CollectionActionFactory, defaultFieldFilter } from './types';

export const resourceNamePattern = /^[a-z\-]+$/i

/**
 * Interface for API server resource definitions.
 */
export interface IResourceDefinition {
  /** Resource's name */
  name: string;

  /**
   *  Name used in the path to the resource's router. Defaults to `${name}s`, ie. `post` becomes
   * `posts`.
   */
  slug?: string;

  /**
   * Function which create's this resource's main data store. The default generated CRUD API will
   * use this store.
   */
  getStore?: (dependencies: IDependencies) => IStore;

  store?: IStore;

  /** Function which creates the resource's JSON API router. */
  getRoutes?: (dependencies: IDependencies, router: express.Router) => void;

  defaultActions?: DefaultActionName[];

  getInstanceActions?: InstanceActionFactory;

  getCollectionActions?: CollectionActionFactory;

  /** Schema objects to add to the API's JSON schema validator. */
  jsonSchemas?: object[];

  /** Callback for filtering out document fields during instance operations. */
  filterFields?: DocumentFieldFilter;
}
