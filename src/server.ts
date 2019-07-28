import * as path from 'path';
import * as fs from 'fs';
import Ajv = require('Ajv');
import express = require('express');
import { ContractViolationError, RequestBodyValidationError } from './errors';
import { errorHandler, notFoundHandler } from './error-handler';
import { all as jsonSchemas } from './json-schemas';
import { IResourceDefinition, resourceNamePattern } from './resource';
import { IDependencies } from './dependencies';
import { IStore } from './store';
import { createDefaultApi, IDefaultApiOptions } from './default-api';

const RESOURCE_FILE_TYPES = [ 'routes', 'store' ];

export class ApiServer {
  private _router?: express.Router;
  private _ajv: Ajv.Ajv;
  private _resources: IResourceDefinition[] = [];
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

  constructor() {
    this._ajv = new Ajv();
    this._ajv.addSchema(jsonSchemas);
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
      .map(item => this.importResource(item.path));
      //.map(item => ({...item, ...require(item.path)}));
    this.addResources(resources);
  }

  /**
   * Import a single resource from a directory.
   *
   * @param directory Path to the resource directory.
   */
  public importResource(directory: string): IResourceDefinition {
    const name = directory.split(path.sep).slice(-1)[0];

    const files = fs.readdirSync(directory)
      .map(name => ({ name, nameParts: name.split('.'), path: path.join(directory, name)}))
      .filter(item => item.nameParts.length === 3)
      .map(item => ({
        ...item,
        extension: item.nameParts.slice(-1)[0],
        type: item.nameParts.slice(-2)[0],
      }))
      .filter(item => RESOURCE_FILE_TYPES.includes(item.type))
      .filter(item => item.nameParts[0] === name && item.extension === 'js')
      .filter(item => fs.statSync(item.path).isFile());

    const resource: IResourceDefinition = {
      name,
    };

    for (let file of files) {
      if (file.type === 'routes') {
        const { getRoutes } = require(file.path);
        if (typeof getRoutes !== 'function') {
          throw new Error(`getRoutes in ${file.path} is not a function`);
        }
        resource.getRoutes = getRoutes;
      } else if (file.type == 'store') {
        resource.store = require(file.path);
      }
    }

    return resource;
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

    const newDependencies:IDependencies = { ...dependencies, apiServer: this };

    // Initialize resources
    for (let resource of this._resources) {
      if (resource.jsonSchemas) {
        this.addSchema(resource.jsonSchemas);
      }

      if (resource.store) {
        const store = new resource.store(newDependencies);
        const dependencyName = store.dependencyName || `${resource.name}Store`;
        newDependencies[dependencyName] = store;
      }
    }

    // Get routes
    this._router = express.Router();
    for (let resource of this._resources) {
      if (!resource.getRoutes) {
        continue;
      }

      const router = express.Router();
      resource.getRoutes(newDependencies, router);

      let slug = `${resource.name}s`;
      if (resource.slug) {
        slug = resource.slug;
      }
      this._router.use(`/${slug}`, router);
    }
    this._router.use(notFoundHandler);
    this._router.use(errorHandler);

    return newDependencies;
  }

  /**
   * Adds a schema to the underlying JSON schema validator.
   * @param schema Schema or an array of schemas.
   */
  public addSchema(schema: object|object[]) {
    this._ajv.addSchema(schema);
  }

  public createDefaultApi(router: express.Router, store: IStore, contract?: string, options: IDefaultApiOptions = {}) {
    createDefaultApi({server:this, store, router, contract, options });
  }

  /**
   * Throw a `RequestBodyValidationError` if an object doesn't match a JSON schema.
   *
   * @param schema Name of JSON schema to validate against.
   * @param data Request body.
   * @returns The `data` argument.
   */
  public assertRequestBody<T>(schema: string, data: any): T {
    const [valid, errors] = this.validateSchema(schema, data);
    if (valid) {
      return data as T;
    }
    throw new RequestBodyValidationError(errors || [], 'Invalid request body');
  }

  /**
   * Validate a JSON response against a contract, throwing `ContractViolationError` on failure.
   *
   * @param schema Name of JSON schema to validate agains.
   * @param data Response body.
   * @returns The `data` argument.
   */
  public assertResponse(schema: string, data: any): any {
    const [valid, errors] = this.validateSchema(schema, data);
    if (valid) {
      return data;
    }
    throw new ContractViolationError(errors || [], `Response body violates contract ${schema}`);
  }

  /**
   * Validate an object against a JSON schema.
   *
   * @param schema Schema ref to validate against.
   * @param data Object to validate.
   * @returns An array with validation status and errors, if any.
   */
  public validateSchema(schema: string, data: any): [boolean, Ajv.ErrorObject[]|null] {
    if (this._ajv.validate(schema, data)) {
      return [true, null];
    }

    if (this._ajv.errors) {
      return [false, [...this._ajv.errors]];
    }

    return [false, null];
  }
}
