export type AttributeFilterFunc<S> = (session: S, key: string) => boolean;

export const permissiveAttributeFilter: AttributeFilterFunc<any>
  = (_session: any, _key: string) => true;

export const restrictiveAttributeFilter: AttributeFilterFunc<any>
  = (_session: any, _key: string) => false;
