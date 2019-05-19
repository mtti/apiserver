import express = require('express');
import * as bodyParser from 'body-parser';
import * as jsonPatch from 'fast-json-patch';
import { IStore } from './store';
import { wrapHandler } from './handler';
import { Uuid } from './uuid';
import { NotFoundError } from './errors';
import { ApiServer } from './server';

const jsonParser = bodyParser.json();

/**
 * Creates a default RESTful JSON CRUD API for a resource.
 *
 * @param apiServer
 * @param store
 * @param schemaRef
 * @param router
 */
export function createDefaultApi(apiServer: ApiServer, store: IStore, schemaRef: string, router: express.Router) {
  // List instances
  router.get('/', wrapHandler(async (req, res) => {
    const result = await store.find(req.query);
    for (let instance of result) {
      apiServer.assertResponse(schemaRef, instance);
    }
    return result;
  }));

  // Create a new instance
  router.post('/', jsonParser, wrapHandler(async (req, res) => {
    const body = apiServer.assertRequestBody<any>(schemaRef, req.body);
    const id = new Uuid();

    const savedDocument = await store.create(id, body);
    return apiServer.assertResponse(schemaRef, savedDocument);
  }));

  // Get an instance
  router.get('/:id', wrapHandler(async (req, res) => {
    const id = new Uuid(req.params.id);
    const instance = await store.load(id);

    if (instance === null) {
      throw new NotFoundError();
    }

    return instance;
  }));

  // Replace an instance
  router.put('/:id', jsonParser, wrapHandler(async (req, res) => {
    const id = new Uuid(req.params.id);
    const instance = apiServer.assertRequestBody<any>(schemaRef, req.body);
    store.replace(id, instance);
  }));

  // Update instance with JSON Patch
  router.patch('/:id', jsonParser, wrapHandler(async (req, res) => {
    const id = new Uuid(req.params.id);
    const patch = apiServer.assertRequestBody<jsonPatch.Operation[]>(
      'https://schemas.mattihiltunen.com/apiserver/json-patch',
      req.body
    );

    const instance = await store.load(id);
    if (instance === null) {
      throw new NotFoundError();
    }

    const newInstance = jsonPatch.applyPatch(instance, patch).newDocument;
    apiServer.assertRequestBody<any>(schemaRef, newInstance);

    await store.replace(id, newInstance);
  }));

  // Delete instance
  router.delete('/:id', wrapHandler(async (req, res) => {
    const id = new Uuid(req.params.id);
    await store.delete(id);
  }));
}
