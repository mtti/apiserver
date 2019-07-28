import express = require('express');
import { IResourceDefinition } from './resource';
import { IStore } from './store';
import { IDependencies, ControllerFactory, DefaultActionName } from './types';
import { wrapHandler } from './handler';
import { defaultActions } from './crud';

export const getDefaultController: ControllerFactory = (dependencies: IDependencies) => ({});

export function initializeController(resource: IResourceDefinition, dependencies: IDependencies): express.Router {
  // Get resource's custom controller or fall back to the default
  let getController: ControllerFactory = getDefaultController;
  if (resource.getController) {
    getController = resource.getController;
  }

  const controller = getController(dependencies);
  if (!controller) {
    throw new Error(`${resource.name}: invalid controller`);
  }

  const router = express.Router();

  // Bind routes for all enabled default actions
  const enabledDefaultActions = controller.defaultActions
    || ['getAll', 'getOne', 'create', 'replace', 'patch', 'delete'];
  if (enabledDefaultActions.length > 0) {
    if (resource.store) {
      for (let action of enabledDefaultActions) {
        defaultActions[action](router, resource.store);
      }
    } else if (controller.defaultActions) {
      throw new Error(`${resource.name}: no store`);
    }
  }

  if (controller.collectionActions) {
    for (let [key, value] of Object.entries(controller.collectionActions)) {
      router.post(`/${key}`, wrapHandler(value));
    }
  }

  if (controller.instanceActions) {
    for (let [key, value] of Object.entries(controller.instanceActions)) {
      router.post(`/:id/${key}`, wrapHandler(value));
    }
  }

  return router;
}

function bindDefaultCrud(enabledActions: DefaultActionName[], router: express.Router, store: IStore) {
  if (enabledActions.includes('getAll')) {
    router.get('/', wrapHandler(async (req, res) => {
      const result = await store.find(req.query);

      return result;
    }));
  }


}
