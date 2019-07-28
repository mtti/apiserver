import { Uuid } from './uuid';
import { IDependencies } from './dependencies';

export interface IStoreConstructor {
  new (dependencies: IDependencies): IStore;
}

export interface IStore {
  /**
   * The name under which this object store will be available as a dependency in ApiServer. Defaults
   * to `${resource.name}Store`. For example, the store for a resource called `widget` will be
   * called `widgetStore`.
   */
  dependencyName?: string;

  /**
   * Find existing instances according to a store-specific query object. The default API forwards
   * the request's query parameters as the `query` argument.
   */
  find: (query: any) => Promise<any[]>;

  /**
   * Load an existing instance. Resolves to `null` if the instance was not found.
   */
  load: (id: Uuid) => Promise<any>;

  /**
   * Create a new object.
   */
  create: (id: Uuid, instance: any) => Promise<any>;

  /**
   * Replace an existing instance of an object with a new version.
   */
  replace: (id: Uuid, instance: any) => Promise<any>;

  /**
   * Delete an existing instance.
   */
  delete: (id: Uuid) => Promise<void>;
}
