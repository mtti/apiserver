import { AccessController } from '../access-control/AccessController';
import { Store } from './Store';

export type ResourceOptions<A, S> = {
  store: Store<A>;

  accessController?: Partial<AccessController<A, S>>;
};
