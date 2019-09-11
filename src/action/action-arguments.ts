import express = require('express');
import { Emitter } from '../emitter';
import { Store } from '../store';
import { Document, RequestDocument } from '../document';

export type ActionArgumentParams<T> = {
  store?: Store<T>|null;
  emitter: Emitter<T>;
  req?: express.Request;
  requestBody?: any|null;
  requestDocument?: RequestDocument<T>|null;
  existingDocument?: Document<T>|null;
  id?: string;
};

export class ActionArguments<T> {
  private _emitter: Emitter<T>;
  private _req: express.Request;
  private _store?: Store<T>;
  private _requestBody?: any;
  private _requestDocument?: RequestDocument<T>;
  private _existingDocument?: Document<T>;
  private _id?: string;

  get emit(): Emitter<T> {
    return this._emitter;
  }

  get req(): express.Request {
    return this._req;
  }

  get store(): Store<T> {
    if (!this._store) {
      throw new Error('Missing: store');
    }
    return this._store;
  }

  get requestBody(): any {
    if (!this._requestBody) {
      throw new Error('Missing: requestBody');
    }
    return this._requestBody;
  }

  get requestDocument(): RequestDocument<T> {
    if (!this._requestDocument) {
      throw new Error('Missing: requestDocument');
    }
    return this._requestDocument;
  }

  get existingDocument(): Document<T> {
    if (!this._existingDocument) {
      throw new Error('Missing: existingDocument');
    }
    return this._existingDocument;
  }

  get id(): string {
    if (!this._id) {
      throw new Error('Missing: id');
    }
    return this._id;
  }

  constructor({
    store,
    emitter,
    req,
    requestBody,
    requestDocument,
    existingDocument,
    id
  }: ActionArgumentParams<T>) {
    this._emitter = emitter;

    if (!req) {
      throw new Error('req is required');
    }
    this._req = req;

    if (store) {
      this._store = store;
    }

    if (requestBody) {
      this._requestBody = requestBody;
    }

    if (requestDocument) {
      this._requestDocument = requestDocument;
    }

    if (existingDocument) {
      this._existingDocument = existingDocument;
    }

    if (id) {
      this._id = id;
    }
  }
}
