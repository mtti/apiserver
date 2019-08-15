
/**
 * A document loaded from a store.
 */
export interface IDocument<T> {
  id: string;
  attributes: T;
}

/**
 * A document received from the client in a request body.
 */
export type RequestDocument<T> = {
  id?: string;
  type: string;
  attributes: T;
};
