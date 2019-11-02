import { suffixUrlFilename } from '../utils/suffixUrlFilename';
import { JsonApiSchemaIds } from './JsonApiSchemaIds';

export function generateSchemaIds(
  attributesSchemaId: string,
): JsonApiSchemaIds {
  return {
    attributes: attributesSchemaId,
    input: suffixUrlFilename(attributesSchemaId, '-input'),
    single: suffixUrlFilename(attributesSchemaId, '-single'),
    collection: suffixUrlFilename(attributesSchemaId, '-collection'),
  };
}
