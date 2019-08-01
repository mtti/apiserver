import express = require('express');
import { Resource } from './resource';

export type SessionParser = (req: express.Request) => Promise<Session>;

export abstract class Session {
  /** Can the session access a resource at all? */
  async canAccessResource(resource: Resource): Promise<boolean> {
    return true;
  }

  async canPerformCollectionAction(resource: Resource, action: string, body?: any): Promise<boolean> {
    return true;
  }

  /** Check if a document action might be possible without loading the target document. */
  async mightPerformDocumentAction(resource: Resource, action: string, id: string, body?: object): Promise<boolean> {
    return true;
  }

  /** Check if an action can be performed, with a fully loaded target document. */
  async canPerformDocumentAction(resource: Resource, action: string, id: string, document: object, body?: any): Promise<boolean> {
    return true;
  }

  /** Filter fields from an incoming document */
  async filterRequestFields(resource: Resource, document: object): Promise<object> {
    return { ...document };
  }

  /** Filter fields from an outgoing document  */
  async filterResponseFields(resource: Resource, document: object): Promise<object> {
    return { ...document };
  }
}

/** A session which allows every action. */
export class PermissiveSession extends Session {}
