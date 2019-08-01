import { IDependencies } from './types/dependencies';

export type StoreFactory = (dependencies: IDependencies) => IStore;

export interface IStore {
  /**
   * Create a new object.
   */
  create: (id: string, instance: any) => Promise<object>;

  /**
   * Load an existing instance. Resolves to `null` if the instance was not found.
   */
  read: (id: string) => Promise<object|null>;

  /**
   * Replace an existing instance of an object with a new version.
   */
  update: (id: string, instance: any) => Promise<object>;

  /**
   * Delete an existing instance.
   */
  destroy: (id: string) => Promise<object>;

  /**
   * List existing documents.
   *
   * Should resolve to an object keyed by each document's primary key as a string.
   */
  list: (query: any) => Promise<object>;
}
