export type PartialDocument<T> = {
  id: string;

  type: string;

  attributes: Partial<T>;
}
