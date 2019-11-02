/**
 * A single JSON:API output document.
 */
export type JsonApiDocument<T> = {
  id: string;
  type: string;
  attributes: T;
};
