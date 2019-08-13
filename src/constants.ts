import { ActionResponseType, DefaultActionName, HttpMethod } from './types';

export const ACTION_RESPONSE_TYPES: ActionResponseType[] = [ 'raw', 'document', 'collection' ];

export const ALL_DEFAULT_ACTIONS: DefaultActionName[] = ['create', 'read', 'replace', 'destroy', 'list'];

/** HTTP methods which will be by default assumed by actions to have a request body */
export const METHODS_WITH_BODY: HttpMethod[] = ['POST', 'PUT', 'PATCH'];

/** Regular expression for valid resource names */
export const RESOURCE_NAME_PATTERN = /^[a-z\-]+$/i

/** List of HTTP methods an action can be configured to use. */
export const SUPPORTED_HTTP_METHODS: HttpMethod[] = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ];
