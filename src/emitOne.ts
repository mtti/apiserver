import { Document } from './Document';
import { Validator } from './validator';
import { JsonApiResponseEnvelope } from './json-api/json-api';

/**
 * Create a JSON API response containing a single document.
 *
 * @param validator
 * @param responseSchemaId
 * @param document
 */
export function emitOne<T>(
  validator: Validator,
  responseSchemaId: string,
  document: Document<T>,
): JsonApiResponseEnvelope<T> {
  const response: JsonApiResponseEnvelope<T> = {
    data: {
      id: document.id,
      type: '',
      attributes: document.attributes,
    },
  };

  validator.assertResponse(responseSchemaId, response);

  return response;
}
