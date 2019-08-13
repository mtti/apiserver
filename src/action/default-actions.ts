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
        .respondsWithDocument(async ({ store, body }) => {
          const id = new Uuid().toString();
          return store.create(id, body);
        });
    },

    read: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('read')
        .hasMethod('GET')
        .hasSuffix(null)
        .respondsWithDocument(async ({ document }) => document);
    },

    replace: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('replace')
        .hasMethod('PUT')
        .hasSuffix(null)
        .respondsWithDocument(async ({ store, id, document, body }) =>
          store.replace(id, { ...document, ...body }));
    },

    patch: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('patch')
        .hasMethod('PATCH')
        .hasSuffix(null)
        .respondsWithDocument(async ({ req, store, id, document, body }) => {
          // TODO: Add JSON-PATCH support
          if (req.is('application/json-patch+json')) {
            if (store.jsonPatch) {
              return store.jsonPatch(id, body);
            }
            throw new UnsupportedMediaTypeError('JSON PATCH is not implemented yet');
          }

          if (store.shallowUpdate) {
            return store.shallowUpdate(id, body);
          }

          // Do a shallow update if JSON-PATCH was no specified
          return store.replace(id, { ...document, ...body });
        });
    },

    destroy: <T>(resource: Resource<T>) => {
      resource.createInstanceAction('destroy')
        .hasMethod('DELETE')
        .hasSuffix(null)
        .respondsWithRaw(async ({ store, id }) => {
          await store.destroy(id);
          return {};
        });
    },

    list: <T>(resource: Resource<T>) => {
      resource.createCollectionAction('list')
        .hasMethod('GET')
        .hasSuffix(null)
        .respondsWithCollection(async ({ store }) => store.list(null));
    },
  };
}
