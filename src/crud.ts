import express = require('express');
import * as bodyParser from 'body-parser';
import * as jsonPatch from 'fast-json-patch';
import { IStore } from './store';
import { wrapHandler } from './handler';
import { Uuid } from './uuid';
import { NotFoundError } from './errors';
import { ApiServer } from './server';
import { DefaultActionName, DefaultActionMap } from './types';

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

const getAll = (router: express.Router, store: IStore) => {
  return wrapHandler(async (req, res) => {
    const result = await store.find(req.query);
    return result;
  });
};

const getOne = (router: express.Router, store: IStore) => {

}

const create = (router: express.Router, store: IStore) => {
  router.post('/', jsonParser, wrapHandler(async (req, res) => {
    const body = req.body;

    const id = new Uuid();
    const savedDocument = await store.create(id, body);

    return savedDocument;
  }));
}

const replace = (router: express.Router, store: IStore) => {
  router.get('/:id', wrapHandler(async (req, res) => {
    const id = new Uuid(req.params.id);
    const instance = await store.load(id);

    if (instance === null) {
      throw new NotFoundError();
    }

    return instance;
  }));
}

const patch = (router: express.Router, store: IStore) => {

}

const deleteOne = (router: express.Router, store: IStore) => {
  router.delete('/:id', wrapHandler(async (req, res) => {
    const id = new Uuid(req.params.id);
    await store.delete(id);
  }));
}

export const defaultActions: DefaultActionMap = {
  getAll,
  getOne,
  create,
  replace,
  patch,
  delete: deleteOne,
};
