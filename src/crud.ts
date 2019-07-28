import express = require('express');
import * as bodyParser from 'body-parser';
import { IStore } from './store';
import { wrapHandler } from './handler';
import { Uuid } from './uuid';
import { NotFoundError } from './errors';
import { DefaultActionMap } from './types';

const jsonParser = bodyParser.json();

const create = (router: express.Router, store: IStore) => {
  router.post('/', jsonParser, wrapHandler(async (req, res) => {
    const body = req.body;

    const id = new Uuid();
    const savedDocument = await store.create(id, body);

    return savedDocument;
  }));
}

const read = (router: express.Router, store: IStore) => {
  router.get('/:id', wrapHandler(async (req, res) => {
    const id = new Uuid(req.params.id);
    const instance = await store.read(id);

    if (instance === null) {
      console.log('!!!!');
      throw new NotFoundError();
    }

    return instance;
  }));
}

const update = (router: express.Router, store: IStore) => {
  router.put('/:id', jsonParser, wrapHandler(async (req, res) => {
    const id = new Uuid(req.params.id);
    const body = req.body;

    const instance = await store.update(id, body);
    if (instance === null) {
      throw new NotFoundError();
    }

    return instance;
  }));
}

const destroy = (router: express.Router, store: IStore) => {
  router.delete('/:id', wrapHandler(async (req, res) => {
    const id = new Uuid(req.params.id);
    await store.destroy(id);
  }));
}

const list = (router: express.Router, store: IStore) => {
  router.get('/', wrapHandler(async (req, res) => {
    const result = await store.list(req.query);
    return result;
  }));
};

export const defaultActions: DefaultActionMap = {
  create,
  read,
  update,
  destroy,
  list,
};
