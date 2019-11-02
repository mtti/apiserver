export type JsonApiSchemaIds = {
  /**
   * JSON Schema ID for document attributes.
   */
  attributes: string;

  /**
   * JSON Schema ID for a JSON:API single document request body.
   */
  input: string;

  /**
   * JSON Schema ID for a JSON:API single document response.
   */
  single: string;

  /**
   * JSON Schema ID for a JSON:API collection response.
   */
  collection: string;
};
