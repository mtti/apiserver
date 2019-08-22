import express = require('express');
import { Resource } from './resource';

/**
 * A callback which crates a Session subclass by parsing an express request.
 */
export type SessionParser = (req: express.Request) => Promise<Session>;

/**
 * Base class for application-specific subclasses.
 */
export abstract class Session {
  /**
   * Check if the session can have any access to a resource at all.
   *
   * @param resource The resource being accessed
   */
  async preAuthorizeResource<T>(resource: Resource<T>): Promise<boolean> {
    return true;
  }

  /**
   * Check if the session is authorized to perform a collection action.
   *
   * @param resource The resource on which the action is being performed
   * @param action Name of the action
   * @param body The request body, if any
   */
  async authorizeCollectionAction<T>(
    resource: Resource<T>,
    action: string,
    body?: any
  ): Promise<boolean> {
    return true;
  }

  /**
   * Check if the session is authorized to perform an action on a document
   * before loading said document.
   *
   * @param resource The resource on which the action is being performed
   * @param action Name of the action being performed
   * @param id ID of the document on which the action is being performed
   * @param body Request body, if any
   */
  async preAuthorizeDocumentAction<T>(
    resource: Resource<T>,
    action: string,
    id: string,
    body?: object
  ): Promise<boolean> {
    return true;
  }

  /**
   * Check if the session is authorized to perform an action on a document.
   *
   * @param resource The resource on which the action is being performed
   * @param action Name of the action being performed
   * @param id ID of the document on which the action is being performed
   * @param document The loaded document on which the action is being performed
   * @param body Request body, if any
   */
  async authorizeDocumentAction<T>(
    resource: Resource<T>,
    action: string,
    id: string,
    document: object,
    body?: any
  ): Promise<boolean> {
    return true;
  }

  /** Filter fields from an incoming document */
  async filterWriteAttributes<T>(
    resource: Resource<T>,
    attributes: T
  ): Promise<T> {
    return { ...attributes };
  }

  /** Filter fields from an outgoing document  */
  async filterReadAttributes<T>(
    resource: Resource<T>,
    attributes: T
  ): Promise<T> {
    return { ...attributes };
  }
}

/**
 * A session which allows every action and filters away no fields.
 */
export class PermissiveSession extends Session {}
