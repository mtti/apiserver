/**
 * A single incoming JSON:API output document.
 */
export type JsonApiDocumentInput<T> = {
  id?: string;
  type: string;
  attributes: T;
};
