import { Uuid } from './uuid';

export interface IStore {
  /**
   * The name under which this object store will be available as a dependency in ApiServer. Defaults
   * to `${resource.name}Store`. For example, the store for a resource called `widget` will be
   * called `widgetStore`.
   */
  dependencyName?: string;

  /**
   * Create a new object.
   */
  create: (id: Uuid, instance: any) => Promise<any>;

  /**
   * Load an existing instance. Resolves to `null` if the instance was not found.
   */
  read: (id: Uuid) => Promise<any>;

  /**
   * Replace an existing instance of an object with a new version.
   */
  update: (id: Uuid, instance: any) => Promise<any>;

  /**
   * Delete an existing instance.
   */
  destroy: (id: Uuid) => Promise<void>;

  /**
   * Find existing instances according to a store-specific query object. The default API forwards
   * the request's query parameters as the `query` argument.
   */
  list: (query: any) => Promise<any[]>;
}
