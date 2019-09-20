import { MapFunc } from '../types';

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
   * Create a function for checking attribute readability.
   *
   * @param session
   * @param resource
   * @returns A function which returns readability status for attribute keys.
   */
  getReadableAttributes(
    session: T,
    resource: string,
  ): Promise<MapFunc<string, boolean>>;

  /**
   * Create a function for checking attribute writability.
   *
   * @param sessionZ
   * @param resource
   * @returns A function which returns writability status for attribute keys.
   */
  getWritableAttributes(
    session: T,
    resource: string,
  ): Promise<MapFunc<string, boolean>>;
}
