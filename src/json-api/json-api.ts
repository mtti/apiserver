import { ApiError } from '../ApiError';
import { RequestDocument } from '../Document';
import { JsonApiError, JsonApiMeta } from './types';

export const JSON_API_CONTENT_TYPE = 'application/vnd.api+json';

export type JsonApiRequestEnvelope<T> = {
  data: RequestDocument<T>;
};

export type JsonApiResponseEnvelope<T> = {
  data?: JsonApiResponseDocument<T> | JsonApiResponseDocument<T>[];
  errors?: JsonApiError[];
  meta?: JsonApiMeta;
};

export type JsonApiErrorResponse = {
  errors: JsonApiError[];
  meta?: JsonApiMeta;
};

export type JsonApiResponseDocument<T> = {
  id: string;
  type: string;
  attributes: T;
};

export function createJsonApiErrorResponse(
  original: Error,
): JsonApiErrorResponse {
  if (original instanceof ApiError) {
    return {
      errors: original.toJsonApi(),
    };
  }

  // Convert misc errors to generic internal server errors
  const result: JsonApiError = {
    title: 'Internal Server Error',
    code: '500',
  };

  if (process.env.NODE_ENV !== 'production') {
    result.meta = {
      stack: original.stack,
      originalMessage: original.message,
    };
  }
  return {
    errors: [result],
  };
}

/**
 * Generate JSON Schema for outgoing JSON:API documents.
 *
 * @param attributesSchemaId
 * @param slug
 */
export function createJsonApiDocumentResponseSchema(
  attributesSchemaId: string,
  slug: string,
): object {
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
export function createJsonApiDocumentRequestSchema(
  attributesSchemaId: string,
  slug: string,
): object {
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
