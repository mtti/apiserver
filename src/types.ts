export type DefaultActionName = 'create' | 'read' | 'replace' | 'patch' | 'destroy' | 'list';

/** Interface for the dependency injection container. */
export interface Dependencies {
  [name: string]: any;
}

export type Dictionary<T> = {
  [key: string]: T;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * A basic JSON Schema object with a required string `$id`.
 */
export type JsonSchema = {
  $id: string;
  [key: string]: unknown;
}
