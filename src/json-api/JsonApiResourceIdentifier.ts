import { JsonApiMeta } from './JsonApiMeta';

/**
 * JSON:API Resource Identifier Object
 */
export type JsonApiResourceIdentifier = {
  id: string;
  type: string;
  meta?: JsonApiMeta;
};
