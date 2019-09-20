/**
 * Error objects provide additional information about problems encountered while
 * performing an operation.
 */
export type JsonApiError = {
  id?: string;
  links?: any;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: any;
  meta?: JsonApiMeta;
};

export type JsonApiMeta = {
  [key: string]: any;
};
