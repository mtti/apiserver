import express = require('express');
import { IResourceDefinition } from './resource';
import { IDependencies, ALL_DEFAULT_ACTIONS } from './types';
import { wrapHandler } from './handler';
import { defaultActions } from './crud';
import { Uuid } from './uuid';
import { NotFoundError } from './errors';

export function initializeActions(resource: IResourceDefinition, dependencies: IDependencies): express.Router {
  const router = express.Router();

  const { store } = resource;

  // Initialize custom collection actions first so they won't conflict with the default /:id

  if (resource.getCollectionActions) {
    const collectionActions = resource.getCollectionActions(dependencies);
    for (let [key, value] of Object.entries(collectionActions)) {
      router.post(`/${key}`, wrapHandler(value));
    }
  }

  // Initialize default actions

  const enabledDefaultActions = resource.defaultActions || ALL_DEFAULT_ACTIONS;

  for (let action of enabledDefaultActions) {
    if (!ALL_DEFAULT_ACTIONS.includes(action)) {
      throw new Error(`${resource.name}: Unknown default action: ${action}`);
    }
  }

  if (enabledDefaultActions.length > 0) {
    if (resource.store) {
      for (let action of enabledDefaultActions) {
        defaultActions[action](router, resource.store);
      }
    } else if (resource.defaultActions) {
      throw new Error(`${resource.name}: can't have default actions without a store`);
    }
  }

  // Initialize instance actions

  if (resource.getInstanceActions) {
    if (!store) {
      throw new Error(`${resource.name}: can't have instance actions without a store`);
    }

    const instanceActions = resource.getInstanceActions(dependencies);

    for (let [actionName, actionHandler] of Object.entries(instanceActions)) {
      router.post(`/:id/${actionName}`, wrapHandler(async (req: express.Request, res: express.Response) => {
        const id = new Uuid(req.params.id);
        const instance = await store.read(id);

        if (instance === null) {
          throw new NotFoundError();
        }

        return actionHandler(instance, req, res);
      }));
    }
  }

  return router;
}
