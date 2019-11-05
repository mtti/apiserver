import { suffixUrlFilename } from '../utils/suffixUrlFilename';
import { JsonApiSchemaIds } from './JsonApiSchemaIds';

/**
 * Generate derived JSON:API schema ID's from base attribute schema ID.
 *
 * @param attributesSchemaId
 */
export function generateSchemaIds(
  attributesSchemaId: string,
): JsonApiSchemaIds {
  return {
    attributes: attributesSchemaId,
    input: suffixUrlFilename(attributesSchemaId, '-jsonapi-input'),
    single: suffixUrlFilename(attributesSchemaId, '-jsonapi-single'),
    collection: suffixUrlFilename(attributesSchemaId, '-jsonapi-collection'),
  };
}
