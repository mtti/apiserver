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

/**
 * Base implementation of `AccessController` which permits everything.
 */
export class PermissiveAccessController implements AccessController<unknown> {
  mightRead(): boolean {
    return true;
  }

  mightWrite(): boolean {
    return true;
  }

  async mightDoAction(): Promise<boolean> {
    return true;
  }

  async canDoCollectionAction(): Promise<boolean> {
    return true;
  }

  async getReadableAttributes(): Promise<MapFunc<string, boolean>> {
    return (): boolean => true;
  }

  async getWritableAttributes(): Promise<MapFunc<string, boolean>> {
    return (): boolean => true;
  }
}

/**
 * Base implementation of `AccessController` which forbids everything.
 */
export class RestrictiveAccessController implements AccessController<unknown> {
  mightRead(): boolean {
    return false;
  }

  mightWrite(): boolean {
    return false;
  }

  async mightDoAction(): Promise<boolean> {
    return false;
  }

  async canDoCollectionAction(): Promise<boolean> {
    return false;
  }

  async getReadableAttributes(): Promise<MapFunc<string, boolean>> {
    return (): boolean => false;
  }

  async getWritableAttributes(): Promise<MapFunc<string, boolean>> {
    return (): boolean => false;
  }
}
