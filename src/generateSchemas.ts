import { suffixUrlFilename } from './utils';
import { Validator } from './Validator';
import {
  createJsonApiDocumentRequestSchema,
  createJsonApiDocumentResponseSchema,
} from './json-api/json-api';


export type GeneratedSchemaIds = {
  documentRequestSchemaId: string;
  collectionResponseSchemaId: string;
  documentResponseSchemaId: string;
};

/**
 * Generate default request and response schemas, add them to a validator and
 * return the IDs of the generated schemas.
 *
 * @param validator
 * @param slug
 * @param attributeSchemaId
 */
export function generateSchemas(
  validator: Validator,
  slug: string,
  attributeSchemaId: string,
): GeneratedSchemaIds {
  const documentRequestSchemaId = suffixUrlFilename(
    attributeSchemaId,
    '-document-request',
  );
  const collectionResponseSchemaId = suffixUrlFilename(
    attributeSchemaId,
    '-collection-response',
  );
  const documentResponseSchemaId = suffixUrlFilename(
    attributeSchemaId,
    '-document-response',
  );

  const documentRequestSchema = {
    $id: documentRequestSchemaId,
    type: 'object',
    properties: {
      data: createJsonApiDocumentRequestSchema(
        attributeSchemaId,
        slug,
      ),
    },
    required: ['data'],
  };

  const collectionResponseSchema = {
    $id: collectionResponseSchemaId,
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: createJsonApiDocumentResponseSchema(
          attributeSchemaId,
          slug,
        ),
      },
      meta: {
        type: 'object',
        additionalProperties: true,
      },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
        },
      },
    },
    required: ['data'],
    additionalProperties: false,
  };

  const documentResponseSchema = {
    $id: documentResponseSchemaId,
    type: 'object',
    properties: {
      data: createJsonApiDocumentResponseSchema(
        attributeSchemaId,
        slug,
      ),
    },
    required: ['data'],
  };

  validator.addSchema([
    documentRequestSchema,
    collectionResponseSchema,
    documentResponseSchema,
  ]);

  return {
    documentRequestSchemaId,
    collectionResponseSchemaId,
    documentResponseSchemaId,
  };
}
