import { JsonApiMeta } from './JsonApiMeta';

/**
 * Error objects provide additional information about problems encountered while
 * performing an operation.
 *
 * @see https://jsonapi.org/format/1.0/#error-objects
 */
export type JsonApiError = {
  id?: string;
  links?: any;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: any;
  meta?: JsonApiMeta;
};
