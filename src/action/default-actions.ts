import { ActionArguments } from './action-arguments';
import { DefaultActionName } from '../types';
import { JSON_API_CONTENT_TYPE } from '../json-api';
import { Resource } from '../resource';
import { Uuid } from '../uuid';

export type DefaultActionFactories<T> = {
  [K in DefaultActionName]: (resource: Resource<T>) => void;
}

export function getDefaultActionFactories<T>(): DefaultActionFactories<T> {
  return {
    create: <T>(resource: Resource<T>): void => {
      resource.withCollectionAction('create')
        .hasMethod('POST')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, store, requestDocument }: ActionArguments<T>) => {
            const id = new Uuid().toString();
            return emit.document(store.create(id, requestDocument.attributes));
          }
        );
    },

    read: <T>(resource: Resource<T>): void => {
      resource.withInstanceAction('read')
        .hasMethod('GET')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, existingDocument }) => emit.document(existingDocument)
        );
    },

    replace: <T>(resource: Resource<T>): void => {
      resource.withInstanceAction('replace')
        .hasMethod('PUT')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, store, id, existingDocument, requestDocument }) =>
            emit.document(
              store.replace(
                id,
                {
                  ...existingDocument.attributes,
                  ...requestDocument.attributes,
                }
              )
            )
        );
    },

    patch: <T>(resource: Resource<T>): void => {
      resource.withInstanceAction('patch')
        .hasMethod('PATCH')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, store, id, existingDocument, requestBody }) => {
            if (store.shallowUpdate) {
              return emit.document(store.shallowUpdate(id, requestBody));
            }
            return emit.document(
              store.replace(id, { ...existingDocument, ...requestBody })
            );
        });
    },

    destroy: <T>(resource: Resource<T>): void => {
      resource.withInstanceAction('destroy')
        .hasMethod('DELETE')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, store, id }) => {
            await store.destroy(id);
            return emit.raw({});
        });
    },

    list: <T>(resource: Resource<T>): void => {
      resource.withCollectionAction('list')
        .hasMethod('GET')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, store }) => emit.collection(store.list(null))
        );
    },
  };
}
