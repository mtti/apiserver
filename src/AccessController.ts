import { MapFunc } from './types';

export interface AccessController<T = unknown> {
  /**
   * Pre-authorize initial read access to a collection.
   *
   * @param session
   * @param resource
   */
  mightRead(session: T, resource: string): boolean;

  /**
   * Pre-authorize initial write access to a collection.
   *
   * @param session
   * @param resource
   */
  mightWrite(session: T, resource: string): boolean;

  /**
   * Pre-authorize session to perform an action on a document before the
   * document is loaded from the database.
   *
   * @param session
   * @param action
   * @param resource
   */
  mightDoAction(
    session: T,
    action: string,
    resource: string,
  ): Promise<boolean>;

  /**
   * Authorize session to perform an action on a resource collection.
   *
   * @param session
   * @param action
   * @param resource
   */
  canDoCollectionAction(
    session: T,
    action: string,
    resource: string,
  ): Promise<boolean>;

  /**
   * Get keys of all the attributes a session is authorized to read.
   *
   * @param session
   * @param resource
   * @returns A map of all readable attributes, or `ALL`.
   */
  getReadableAttributes(
    session: T,
    resource: string,
  ): Promise<MapFunc<string, boolean>>;

  /**
   * Get keys of all the attributes a session is auhotirzed to write.
   *
   * @param sessionZ
   * @param resource
   * @returns A map of all writable attributes, or `ALL`.
   */
  getWritableAttributes(
    session: T,
    resource: string,
  ): Promise<MapFunc<string, boolean>>;
}
