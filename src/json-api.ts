export function getJsonApiDataEnvelopeSchema(documentSchemaId: string, slug: string): object {
  return {
    type: 'object',
    properties: {
      type: {
        const: slug,
      },
      id: {
        type: 'string',
      },
      attributes: {
        $ref: documentSchemaId,
      },
    },
  };
}
