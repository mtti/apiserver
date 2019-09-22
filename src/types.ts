/**
 * A basic JSON Schema object with a required string `$id`.
 */
export type JsonSchema = {
  $id: string;
  [key: string]: unknown;
}

export type MapFunc<K, V> = (key: K) => V;
