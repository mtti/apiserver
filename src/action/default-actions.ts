import { UnsupportedMediaTypeError } from '../errors';
import { Uuid } from '../uuid';
import { Resource } from '../resource';
import { DefaultActionName } from '../types';

export type DefaultActionFactories<T> = {
  [K in DefaultActionName]: (resource: Resource<T>) => void;
}

export function getDefaultActionFactories<T>(): DefaultActionFactories<T> {
  return {
    create: <T>(resource: Resource<T>) => {
      resource.createCollectionAction('create')
        .hasMethod('POST')
        .hasSuffix(null)
        .respondsWith(async ({ emit, store, requestDocument }) => {
          const id = new Uuid().toString();
          return emit.document(store.create(id, requestDocument));
        });
    },

    read: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('read')
        .hasMethod('GET')
        .hasSuffix(null)
        .respondsWith(async ({ emit, existingDocument }) => emit.document(existingDocument));
    },

    replace: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('replace')
        .hasMethod('PUT')
        .hasSuffix(null)
        .respondsWith(async ({ emit, store, id, existingDocument, requestDocument }) =>
          emit.document(store.replace(id, { ...existingDocument, ...requestDocument })));
    },

    patch: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('patch')
        .hasMethod('PATCH')
        .hasSuffix(null)
        .respondsWith(async ({ emit, req, store, id, existingDocument, requestBody }) => {
          // TODO: Add JSON-PATCH support
          if (req.is('application/json-patch+json')) {
            if (store.jsonPatch) {
              return emit.document(store.jsonPatch(id, requestBody));
            }
            throw new UnsupportedMediaTypeError('JSON PATCH is not implemented yet');
          }

          if (store.shallowUpdate) {
            return emit.document(store.shallowUpdate(id, requestBody));
          }

          // Do a shallow update if JSON-PATCH was no specified
          return emit.document(store.replace(id, { ...document, ...requestBody }));
        });
    },

    destroy: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('destroy')
        .hasMethod('DELETE')
        .hasSuffix(null)
        .respondsWith(async ({ emit, store, id }) => {
          await store.destroy(id);
          return emit.raw({});
        });
    },

    list: <T>(resource: Resource<T>) => {
      resource.createCollectionAction('list')
        .hasMethod('GET')
        .hasSuffix(null)
        .respondsWith(async ({ emit, store }) => emit.collection(store.list(null)));
    },
  };
}
