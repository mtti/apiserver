import express = require('express');
import { Resource } from './resource';
import { Validator } from './validator';
import { wrapHandler } from './handler';
import { errorHandler, notFoundHandler } from './error-handler';
import { PermissiveSession, SessionParser} from './session';

export class ApiServer {
  private _sessionParser: SessionParser = async () => new PermissiveSession();
  private _validator: Validator;
  private _router?: express.Router;
  private _resources: Resource[] = [];
  private _initialized = false;

  /**
   * An Express router bound to API resources. Only available after the API
   * server has been initialized. Accessing this property before that will throw
   * an Error.
   */
  public get router(): express.Router {
    if (!this._router) {
      throw new Error('Router unavailable because ApiServer has not been initialized');
    }
    return this._router;
  }

  public get validator(): Validator {
    return this._validator;
  }

  public get getSession(): SessionParser {
    return this._sessionParser;
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
   * Add resource definitions. Only available before the API server is
   * initialized. Calling this before will throw an Error.
   *
   * @param resources Resource definitions to add.
   */
  public addResources(resources: Resource[]): void {
    if (this._initialized) {
      throw new Error('Tried to add a resource after ApiServer initializaton');
    }
    for (const resource of resources) {
      if (!(resource instanceof Resource)) {
        throw new Error('Tried to add a resource that is not a Resource class instance');
      }
    }

    this._resources.push(...resources);
  }

  /**
   * Initialize the API server.
   *
   * @param dependencies Dependencies to inject into the store and router
   *   creation callbacks.
   * @returns A promise resolving to a copy of the `dependencies` argument with
   *   the ApiServer and resource stores added to it.
   */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      throw new Error('Tried to initialize an ApiServer more than once');
    }

    const collections: string[] = [];

    // Initialize resource stores
    for (const resource of this._resources) {
      collections.push(resource.slug);

      await resource.initialize();

      this._validator.addSchema(resource.schemas);
    }

    // Initialize actions and custom routes

    this._router = express.Router();

    this._router.get('/', wrapHandler(async (req: express.Request, res: express.Response) => collections));

    for (const resource of this._resources) {
      const router = resource.bind(this);
      this._router.use(`/${resource.slug}`, router);
    }

    this._router.use(notFoundHandler);
    this._router.use(errorHandler);
  }
}
