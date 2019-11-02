import { suffixUrlFilename } from '../utils/suffixUrlFilename';
import { createInputSchema } from './createInputSchema';
import { createCollectionResponseSchema } from './createCollectionResponseSchema';
import { createResponseSchema } from './createResponseSchema';
import { JsonApiSchemaIds } from './JsonApiSchemaIds';

/**
 * Generate JSON Schemas related to a resource.
 *
 * @param slug
 * @param schemaIds
 */
export function createSchemas(
  slug: string,
  schemaIds: JsonApiSchemaIds,
): object[] {
  return [
    createInputSchema(
      suffixUrlFilename(schemaIds.input, '-input'),
      slug,
      schemaIds.attributes,
    ),
    createResponseSchema(
      suffixUrlFilename(schemaIds.single, '-single'),
      slug,
      schemaIds.attributes,
    ),
    createCollectionResponseSchema(
      suffixUrlFilename(schemaIds.collection, '-collection'),
      slug,
      schemaIds.attributes,
    ),
  ];
}
