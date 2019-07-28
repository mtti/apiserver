import express = require('express');
import * as bodyParser from 'body-parser';
import * as jsonPatch from 'fast-json-patch';
import { IStore } from './store';
import { wrapHandler } from './handler';
import { Uuid } from './uuid';
import { NotFoundError } from './errors';
import { ApiServer } from './server';

const jsonParser = bodyParser.json();

export interface IDefaultApiArguments {
  server: ApiServer,

  router: express.Router,

  store: IStore,

  contract?: string,

  options: IDefaultApiOptions
}

export interface IDefaultApiOptions {
  methods?: string[],
}

/**
 * Creates a default RESTful JSON CRUD API for a resource.
 *
 * @param apiServer
 * @param store
 * @param schemaRef
 * @param router
 */
export function createDefaultApi({ server, router, store, contract, options}: IDefaultApiArguments) {
  let { methods } = options;
  if (!methods) {
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  }

  // List instances
  if (methods.includes('GET')) {
    router.get('/', wrapHandler(async (req, res) => {
      const result = await store.find(req.query);

      if (contract) {
        for (let instance of result) {
          server.assertResponse(contract, instance);
        }
      }

      return result;
    }));
  }

  // Create a new instance
  if (methods.includes('POST')) {
    router.post('/', jsonParser, wrapHandler(async (req, res) => {
      let body: any;
      if (contract) {
        body = server.assertRequestBody<any>(contract, req.body);
      } else {
        body = req.body;
      }

      const id = new Uuid();
      const savedDocument = await store.create(id, body);

      if (contract) {
        return server.assertResponse(contract, savedDocument);
      }
      return savedDocument;
    }));
  }

  // Get an instance
  if (methods.includes('GET')) {
    router.get('/:id', wrapHandler(async (req, res) => {
      const id = new Uuid(req.params.id);
      const instance = await store.load(id);

      if (instance === null) {
        throw new NotFoundError();
      }

      if (contract) {
        return server.assertResponse(contract, instance);
      }
      return instance;
    }));
  }

  // Replace an instance
  if (methods.includes('PUT')) {
    router.put('/:id', jsonParser, wrapHandler(async (req, res) => {
      const id = new Uuid(req.params.id);

      let instance: any;
      if (contract) {
        instance = server.assertRequestBody<any>(contract, req.body);
      } else {
        instance = req.body;
      }

      store.replace(id, instance);
    }));
  }

  // Update instance with JSON Patch
  if (methods.includes('PATCH')) {
    router.patch('/:id', jsonParser, wrapHandler(async (req, res) => {
      const id = new Uuid(req.params.id);
      const patch = server.assertRequestBody<jsonPatch.Operation[]>(
        'https://schemas.mattihiltunen.com/apiserver/json-patch',
        req.body
      );

      const instance = await store.load(id);
      if (instance === null) {
        throw new NotFoundError();
      }

      const newInstance = jsonPatch.applyPatch(instance, patch).newDocument;

      if (contract) {
        server.assertRequestBody<any>(contract, newInstance);
      }

      await store.replace(id, newInstance);
    }));
  }

  // Delete instance
  if (methods.includes('DELETE')) {
    router.delete('/:id', wrapHandler(async (req, res) => {
      const id = new Uuid(req.params.id);
      await store.delete(id);
    }));
  }
}
