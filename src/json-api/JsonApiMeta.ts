export type JsonApiMeta = {
  [key: string]: unknown;
}

export type CanHaveJsonApiMeta = {
  meta?: JsonApiMeta;
}
