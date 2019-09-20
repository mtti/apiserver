/* eslint-disable class-methods-use-this */

import { MapFunc } from '../types';
import { AccessController } from './AccessController';

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
