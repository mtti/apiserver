import { IStore } from './store';

export type DefaultActionName = 'create' | 'read' | 'replace' | 'patch' | 'destroy' | 'list';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Raw document */
export interface IDocument {
  [name: string]: any;
}

/** Interface for the dependency injection container. */
export interface IDependencies {
  [name: string]: any;
}
