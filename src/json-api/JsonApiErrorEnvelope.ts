import { JsonApiObject } from './JsonApiObject';
import { JsonApiError } from './JsonApiError';
import { JsonApiMeta } from './JsonApiMeta';

/**
 * JSON:API envelope of an error response.
 *
 * @see https://jsonapi.org/format/1.0/#document-top-level
 */
export type JsonApiErrorEnvelope<T> = {
  jsonapi: JsonApiObject;
  errors: JsonApiError[];
  meta?: JsonApiMeta;
}
