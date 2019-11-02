import { CanHaveJsonApiMeta } from './JsonApiMeta';

/**
 * @see https://jsonapi.org/format/1.0/#document-jsonapi-object
 */
export type JsonApiObject = {
  version: '1.0';
} & CanHaveJsonApiMeta;
