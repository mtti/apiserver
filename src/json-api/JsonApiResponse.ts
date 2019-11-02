import { JsonApiObject } from './JsonApiObject';
import { JsonApiDocument } from './JsonApiDocument';
import { JsonApiMeta } from './JsonApiMeta';

export type JsonApiResponse<T> = {
  jsonapi: JsonApiObject;
  data: JsonApiDocument<T> | JsonApiDocument<T>[];
  meta?: JsonApiMeta;
}
