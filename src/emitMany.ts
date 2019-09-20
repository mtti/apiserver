import { Document } from './Document';
import { Validator } from './validator';
import { JsonApiResponseDocument, JsonApiResponseEnvelope } from './json-api';

/**
 * Create a JSON API response containing multiple documents.
 *
 * @param validator
 * @param responseSchemaId
 * @param documents
 */
export function emitMany<T>(
  validator: Validator,
  responseSchemaId: string,
  documents: Document<T>[]
): JsonApiResponseEnvelope<T> {

  const responseDocuments = documents
    .map((document): JsonApiResponseDocument<T>  => ({
      id: document.id,
      attributes: document.attributes,
      type: '',
    }));

  const response: JsonApiResponseEnvelope<T> = {
    data: responseDocuments,
  }

  validator.assertResponse(responseSchemaId, response);

  return response;
}
