import { RequestDocument } from './document';

export type JsonApiRequestEnvelope<T> = {
  data: RequestDocument<T>;
};

export type JsonApiResponseEnvelope<T> = {
  data?: JsonApiResponseDocument<T> | JsonApiResponseDocument<T>[];
};

export type JsonApiResponseDocument<T> = {
  id: string;
  type: string;
  attributes: T;
};

/**
 * Generate JSON Schema for outgoing JSON:API documents.
 *
 * @param attributesSchemaId
 * @param slug
 */
export function createJsonApiDocumentResponseSchema(attributesSchemaId: string, slug: string): object {
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
        $ref: attributesSchemaId,
      },
    },
    required: ['type', 'id', 'attributes'],
  };
}

/**
 * Generate JSON Schema for incoming JSON:API documents.
 *
 * @param attributesSchemaId
 * @param slug
 */
export function createJsonApiDocumentRequestSchema(attributesSchemaId: string, slug: string): object {
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
        $ref: attributesSchemaId,
      },
    },
    required: ['type', 'attributes'],
  };
}
