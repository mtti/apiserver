import express = require('express');
import { IResourceDefinition } from './resource';
import { IDependencies, ControllerFactory, ALL_DEFAULT_ACTIONS } from './types';
import { wrapHandler } from './handler';
import { defaultActions } from './crud';
import { Uuid } from './uuid';
import { NotFoundError } from './errors';

export const getDefaultController: ControllerFactory = (dependencies: IDependencies) => ({});

export function initializeController(resource: IResourceDefinition, dependencies: IDependencies): express.Router {
  // Get resource's custom controller or fall back to the default
  let getController: ControllerFactory = getDefaultController;
  if (resource.getController) {
    getController = resource.getController;
  }

  const store = resource.store;

  const controller = getController(dependencies);
  if (!controller) {
    throw new Error(`${resource.name}: invalid controller`);
  }

  const router = express.Router();

  // Bind routes for all enabled default actions
  const enabledDefaultActions = controller.defaultActions || ALL_DEFAULT_ACTIONS;

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
    } else if (controller.defaultActions) {
      throw new Error(`${resource.name}: can't have default actions without a store`);
    }
  }

  if (controller.collectionActions) {
    for (let [key, value] of Object.entries(controller.collectionActions)) {
      router.post(`/${key}`, wrapHandler(value));
    }
  }

  if (controller.instanceActions) {
    if (!store) {
      throw new Error(`${resource.name}: can't have instance actions without a store`);
    }

    for (let [key, value] of Object.entries(controller.instanceActions)) {
      router.post(`/:id/${key}`, wrapHandler(async (req: express.Request, res: express.Response) => {
        const id = new Uuid(req.params.id);
        const instance = await store.read(id);

        if (instance === null) {
          throw new NotFoundError();
        }

        return value(instance, req, res);
      }));
    }
  }

  return router;
}
