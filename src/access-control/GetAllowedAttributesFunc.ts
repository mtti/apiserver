export type GetAllowedAttributesFunc<S> = (session: S) => string[]|true;

export const permissiveGetAllowedAttributes: GetAllowedAttributesFunc<any>
  = (_session: any) => true;

export const restrictiveGetAllowedAttributes: GetAllowedAttributesFunc<any>
  = (_session: any) => [];
