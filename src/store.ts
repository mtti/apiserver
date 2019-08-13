import { IDependencies } from './types';
import { IDocument } from './document';

export type StoreFactory<T> = (dependencies: IDependencies) => IStore<T>;

export interface IStore<T> {
  /**
   * Create a new object.
   */
  create: (id: string, instance: any) => Promise<IDocument<T>>;

  /**
   * Load an existing instance. Resolves to `null` if the instance was not found.
   */
  read: (id: string) => Promise<IDocument<T>|null>;

  /**
   * Replace an existing instance of an object with a new version, returning the new version.
   */
  replace: (id: string, instance: any) => Promise<IDocument<T>>;

  /**
   * Delete an existing instance.
   */
  destroy: (id: string) => Promise<void>;

  /**
   * List existing documents.
   *
   * Should resolve to an object keyed by each document's primary key as a string.
   */
  list: (query: any) => Promise<IDocument<T>[]>;

  /**
   * Optional optimized shallow update that receives just the fields to be updated.
   */
  shallowUpdate?: (id: string, updates: object) => Promise<IDocument<T>>;

  /**
   * Optional optimized JSON-PATCH which receives just the patch object.
   */
  jsonPatch?: (id: string, patch: object) => Promise<IDocument<T>>;
}
