/**
 * Generate JSON Schema for incoming JSON:API documents.
 *
 * @param id The ID of the JSON schema to be generated.
 * @param attributesSchemaId The ID of the JSON schema describing the object's
 *  attributes.
 * @param slug The slug identifying the object type.
 */
export function createInputSchema(
  id: string,
  slug: string,
  attributesSchemaId: string,
): object {
  return {
    $id: id,
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          type: {
            const: slug,
          },
          id: {
            type: 'string',
          },
          attributes: {
            $ref: attributesSchemaId,
          },
        },
        required: ['type', 'attributes'],
      },
    },
    required: ['data'],
  };
}
