import * as path from 'path';
import * as fs from 'fs';
import express = require('express');
import { errorHandler, notFoundHandler } from './error-handler';
import { Resource } from './resource';
import { IDependencies } from './types';
import { Validator } from './validator';
import { wrapHandler } from './handler';
import { SessionParser, PermissiveSession} from './session';

export class ApiServer {
  private _sessionParser: SessionParser = async () => new PermissiveSession();
  private _validator: Validator;
  private _router?: express.Router;
  private _resources: Resource[] = [];
  private _initialized: boolean = false;

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
  constructor(sessionParser?: SessionParser) {
    if (sessionParser) {
      this._sessionParser = sessionParser;
    }
    this._validator = new Validator();
  }

  /**
   * Add resource definitions. Only available before the API server is initialized. Calling this
   * before will throw an Error.
   *
   * @param resources Resource definitions to add.
   */
  public addResources(resources: Resource[]) {
    if (this._initialized) {
      throw new Error('Tried to add a resource after ApiServer initializaton');
    }
    for (let resource of resources) {
      if (!(resource instanceof Resource)) {
        throw new Error('Tried to add a resource that is not a Resource class instance');
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
  public async initialize(baseDependencies: IDependencies): Promise<IDependencies> {
    if (this._initialized) {
      throw new Error('Tried to initialize an ApiServer more than once');
    }

    const dependencies:IDependencies = {
      ...baseDependencies,
      apiServer: this,
      validator: this._validator,
      stores: {},
      getSession: this._sessionParser,
    };
    const collections: string[] = [];

    // Initialize resource stores
    for (let resource of this._resources) {
      collections.push(resource.slug);

      this._validator.addSchema(resource.schemas);

      const initializedResource = resource.initialize(dependencies);
      if (initializedResource.hasStore) {
        dependencies.stores[resource.name] = initializedResource.store;
      }
    }

    // Initialize actions and custom routes

    this._router = express.Router();

    this._router.get('/', wrapHandler(async (req: express.Request, res: express.Response) => collections));

    for (let resource of this._resources) {
      const router = resource.bind(dependencies);
      this._router.use(`/${resource.slug}`, router);
    }

    this._router.use(notFoundHandler);
    this._router.use(errorHandler);

    return dependencies;
  }
}
