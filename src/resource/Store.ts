import { Document } from './Document';

export type Store<T = Record<string, unknown>> = {
  /**
   * Create a new object.
   */
  create: (id: string, attributes: T) => Promise<Document<T>>;

  /**
   * Load an existing instance. Resolves to `null` if the instance was not
   * found.
   */
  read: (id: string) => Promise<Document<T>|null>;

  /**
   * Completely replace an existing instance of an object with a new version,
   * returning the new version.
   */
  replace: (id: string, attributes: T) => Promise<Document<T>>;

  /**
   * Delete an existing instance.
   */
  destroy: (id: string) => Promise<void>;

  /**
   * List existing documents.
   */
  list: (query: any) => Promise<Document<T>[]>;
}
