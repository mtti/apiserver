/* eslint-disable class-methods-use-this */

import { MapFunc } from '../types';
import { AccessController } from './AccessController';

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
