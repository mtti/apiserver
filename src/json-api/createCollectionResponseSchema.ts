/**
 * Generate JSON Schema for a JSON:API response containing multiple documents.
 *
 * @param id The ID of the JSON schema to be generated.
 * @param attributesSchemaId The ID of the JSON schema describing the object's
 *  attributes.
 * @param slug The slug identifying the object type.
 */
export function createCollectionResponseSchema(
  id: string,
  slug: string,
  attributesSchemaId: string,
): object {
  return {
    $id: id,
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
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
          required: ['id', 'type', 'attributes'],
          additionalProperties: false,
        },
      },
    },
    required: ['data'],
    additionalProperties: false,
  };
}
