import { FullDocument } from './FullDocument';

export interface Store<T = Record<string, unknown>> {
  /**
   * Create a new object.
   */
  create: (id: string, attributes: T) => Promise<FullDocument<T>>;

  /**
   * Load an existing instance. Resolves to `null` if the instance was not
   * found.
   */
  read: (id: string) => Promise<FullDocument<T>|null>;

  /**
   * Completely replace an existing instance of an object with a new version,
   * returning the new version.
   */
  replace: (id: string, attributes: T) => Promise<FullDocument<T>>;

  /**
   * Delete an existing instance.
   */
  destroy: (id: string) => Promise<void>;

  /**
   * List existing documents.
   */
  list: (query: any) => Promise<FullDocument<T>[]>;
}
