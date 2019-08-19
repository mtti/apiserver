export type DefaultActionName = 'create' | 'read' | 'replace' | 'patch' | 'destroy' | 'list';

export type Dictionary<T> = {
  [key: string]: T;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Interface for the dependency injection container. */
export interface IDependencies {
  [name: string]: any;
}
