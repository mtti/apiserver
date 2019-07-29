import * as path from 'path';
import * as fs from 'fs';
import express = require('express');
import { errorHandler, notFoundHandler } from './error-handler';
import { IResourceDefinition, resourceNamePattern } from './resource';
import { IDependencies, SessionParser } from './types';
import { initializeActions } from './actions';
import { Validator } from './validator';

export class ApiServer {
  private _validator: Validator;
  private _router?: express.Router;
  private _resources: IResourceDefinition[] = [];
  private _initialized: boolean = false;
  private _getSession: SessionParser;

  /**
   * An Express router bound to API resources. Only available after the API server has been
   * initialized. Accessing this property before that will throw an Error.
   */
  public get router(): express.Router {
    if (!this._router) {
      throw new Error('Router unavailable because ApiServer has not been initialized');
    }
    return this._router;
  }

  /**
   * Constructor
   *
   * @param getSession Function that parses a session from an express request.
   */
  constructor(getSession?: SessionParser) {
    this._validator = new Validator();
    this._getSession = getSession || (async (req: express.Request) => null);
  }

  /**
   * Add resource definitions. Only available before the API server is initialized. Calling this
   * before will throw an Error.
   *
   * @param resources Resource definitions to add.
   */
  public addResources(resources: IResourceDefinition[]) {
    if (this._initialized) {
      throw new Error('Tried to add a resource after ApiServer initializaton');
    }

    // Runtime validation
    for (let resource of resources) {
      if (!resource.name || !resourceNamePattern.test(resource.name)) {
        throw new Error('Missing or invalid resource name');
      }
      if (resource.slug && !resourceNamePattern.test(resource.slug)) {
        throw new Error(`Resource ${resource.name} has an invalid slug`);
      }
    }

    this._resources.push(...resources);
  }

  /**
   * Import resources from a file system path. Only available before the API server is initialized.
   * Calling this before will throw an Error.
   *
   * @param directory Path to the directory to import resources from. Should be a directory
   *  which contains JavaScript modules as subdirectories.
   */
  public importResources(directory: string) {
    const resources = fs.readdirSync(directory)
      .map(item => ({ name: item, path: path.join(directory, item)}))
      .filter(item => fs.statSync(item.path).isDirectory())
      .map(item => ({...item, ...require(item.path)}));
    this.addResources(resources);
  }

  /**
   * Initialize the API server.
   *
   * @param dependencies Dependencies to inject into the store and router creation callbacks.
   * @returns A promise resolving to a copy of the `dependencies` argument with the ApiServer
   *  and resource stores added to it.
   */
  public async initialize(dependencies: IDependencies): Promise<IDependencies> {
    if (this._initialized) {
      throw new Error('Tried to initialize an ApiServer more than once');
    }

    const newDependencies:IDependencies = {
      ...dependencies,
      apiServer: this,
      validator: this._validator
    };

    // Initialize resources
    for (let resource of this._resources) {
      if (resource.jsonSchemas) {
        this._validator.addSchema(resource.jsonSchemas);
      }

      if (resource.getStore) {
        resource.store = resource.getStore(newDependencies);
        const dependencyName = resource.store.dependencyName || `${resource.name}Store`;
        newDependencies[dependencyName] = resource.store;
      }
    }

    this._router = express.Router();

    // Initialize controllers
    for (let resource of this._resources) {
      const router = initializeActions(resource, newDependencies);

      if (resource.getRoutes) {
        resource.getRoutes(newDependencies, router);
      }

      const slug = resource.slug || `${resource.name}s`;
      this._router.use(`/${slug}`, router);
    }

    this._router.use(notFoundHandler);
    this._router.use(errorHandler);

    return newDependencies;
  }
}
