import { Dependencies } from './types';
import { Document } from './document';

export type StoreFactory<T> = (dependencies: Dependencies) => Store<T>;

export interface Store<T> {
  /**
   * Create a new object.
   */
  create: (id: string, instance: any) => Promise<Document<T>>;

  /**
   * Load an existing instance. Resolves to `null` if the instance was not found.
   */
  read: (id: string) => Promise<Document<T>|null>;

  /**
   * Replace an existing instance of an object with a new version, returning the new version.
   */
  replace: (id: string, instance: any) => Promise<Document<T>>;

  /**
   * Delete an existing instance.
   */
  destroy: (id: string) => Promise<void>;

  /**
   * List existing documents.
   *
   * Should resolve to an object keyed by each document's primary key as a string.
   */
  list: (query: any) => Promise<Document<T>[]>;

  /**
   * Optional optimized shallow update that receives just the fields to be updated.
   */
  shallowUpdate?: (id: string, updates: object) => Promise<Document<T>>;

  /**
   * Optional optimized JSON-PATCH which receives just the patch object.
   */
  jsonPatch?: (id: string, patch: object) => Promise<Document<T>>;
}
