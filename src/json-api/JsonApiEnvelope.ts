import { JsonApiObject } from './JsonApiObject';
import { JsonApiDocument } from './JsonApiDocument';
import { JsonApiMeta } from './JsonApiMeta';

/**
 * JSON:API envelope of a successful response.
 *
 * @see https://jsonapi.org/format/1.0/#document-top-level
 */
export type JsonApiEnvelope<T> = {
  jsonapi: JsonApiObject;
  data: JsonApiDocument<T> | JsonApiDocument<T>[];
  meta?: JsonApiMeta;
}
