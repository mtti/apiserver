import { AttributeFilterFunc } from '../access-control/AttributeFilterFunc';
import { AuthorizeCollectionActionFunc }
  from '../access-control/AuthorizeCollectionActionFunc';
import { AuthorizeDocumentActionFunc }
  from '../access-control/AuthorizeDocumentActionFunc';
import { Store } from './Store';

export type ResourceOptions<A, S> = {
  slug: string;

  store: Store<A>;

  /**
   * Callback for authorizing actions targeted at the resource collection.
   */
  authorizeCollectionAction?: AuthorizeCollectionActionFunc<S>;

  /**
   * Callback for authorizing actions targeted at a resource instance.
   */
  authorizeDocumentAction?: AuthorizeDocumentActionFunc<A, S>;

  filterReadableAttributes?: AttributeFilterFunc<S>;

  filterWritableAttributes?: AttributeFilterFunc<S>;
};
