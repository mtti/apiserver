import Ajv from 'ajv';
import { JsonSchemaViolationError } from '../errors/JsonSchemaViolationError';

export type ExpectJsonDocumentFunc<T> = (data: unknown) => T;

/**
 * Create a function for validating objects agains a JSON Schema.
 *
 * @param ajv
 * @param schemaId
 */
export const expectJsonDocument = <T>(
  ajv: Ajv.Ajv,
  schema: string|object,
): ExpectJsonDocumentFunc<T> => (
    (data: unknown): T => {
      if (ajv.validate(schema, data)) {
        return data as T;
      }

      if (ajv.errors) {
        throw new JsonSchemaViolationError([...ajv.errors]);
      }

      throw new JsonSchemaViolationError([]);
    }
  );
