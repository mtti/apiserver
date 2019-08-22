import { JSON_API_CONTENT_TYPE } from '../json-api';
import { Uuid } from '../uuid';
import { Resource } from '../resource';
import { DefaultActionName } from '../types';

export type DefaultActionFactories<T> = {
  [K in DefaultActionName]: (resource: Resource<T>) => void;
}

export function getDefaultActionFactories<T>(): DefaultActionFactories<T> {
  return {
    create: <T>(resource: Resource<T>): void => {
      resource.createCollectionAction('create')
        .hasMethod('POST')
        .hasSuffix(null)
        .respondsToContentType(JSON_API_CONTENT_TYPE, async ({ emit, store, requestDocument }) => {
          const id = new Uuid().toString();
          return emit.document(store.create(id, requestDocument));
        });
    },

    read: <T>(resource: Resource<T>): void => {
      resource.createInstanceAction('read')
        .hasMethod('GET')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, existingDocument }) => emit.document(existingDocument)
        );
    },

    replace: <T>(resource: Resource<T>): void => {
      resource.createInstanceAction('replace')
        .hasMethod('PUT')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, store, id, existingDocument, requestDocument }) =>
            emit.document(store.replace(id, { ...existingDocument, ...requestDocument }))
        );
    },

    patch: <T>(resource: Resource<T>): void => {
      resource.createInstanceAction('patch')
        .hasMethod('PATCH')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, store, id, existingDocument, requestBody }) => {
            if (store.shallowUpdate) {
              return emit.document(store.shallowUpdate(id, requestBody));
            }
            return emit.document(store.replace(id, { ...existingDocument, ...requestBody }));
        });
    },

    destroy: <T>(resource: Resource<T>): void => {
      resource.createInstanceAction('destroy')
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
      resource.createCollectionAction('list')
        .hasMethod('GET')
        .hasSuffix(null)
        .respondsToContentType(
          JSON_API_CONTENT_TYPE,
          async ({ emit, store }) => emit.collection(store.list(null))
        );
    },
  };
}
