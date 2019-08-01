
import { IStore } from '../store';
import { Validator } from '../validator';

/** Interface for the dependency injection container. */
export interface IDependencies {
  stores: {
    [name: string]: IStore,
  };

  [name: string]: any;
}
