import express = require('express');
import { Document } from './document';
import { JSON_API_CONTENT_TYPE, JsonApiResponseEnvelope } from './json-api';
import { Resource } from './resource';
import { Session } from './session';
import { assertAccepts, isPromise } from './utils';
import { Validator } from './validator';

export class Emitter<T> {
  private _validator: Validator;
  private _resource: Resource;
  private _req: express.Request;
  private _session: Session;
  private _response?: JsonApiResponseEnvelope<T>;
  private _contentType: string|null = null;

  public get response(): object {
    if (!this._response) {
      throw new Error('No response emitted');
    }
    return this._response;
  }

  public get contentType(): string {
    if (!this._contentType) {
      throw new Error('No content type set');
    }
    return this._contentType;
  }

  constructor(
    validator: Validator,
    resource: Resource,
    req: express.Request,
    session: Session
  ) {
    this._validator = validator;
    this._resource = resource;
    this._req = req;
    this._session = session;
  }

  /**
   * Emit a single document
   *
   * @param response
   */
  public async document(
    response: Document<T> | Promise<Document<T>>
  ): Promise<this> {
    this.assertNotEmitted();
    this.chooseContentType([JSON_API_CONTENT_TYPE, 'application/json']);

    let document: Document<T>;
    if (isPromise(response)) {
      document = await (response as Promise<Document<T>>);
    } else {
      document = response;
    }

    const finalResponse = {
      data: {
        id: document.id,
        type: this._resource.slug,
        attributes: await this._session.filterReadAttributes<T>(
          this._resource,
          document.attributes
        ),
      }
    }

    this._validator.assertResponse(
      this._resource.documentResponseSchemaId,
      finalResponse
    );
    this._response = finalResponse;
    return this;
  }

  /**
   * Emit a collection of documents.
   *
   * @param response
   */
  public async collection(
    response: Document<T>[] | Promise<Document<T>[]>
  ): Promise<this> {
    this.assertNotEmitted();
    this.chooseContentType([JSON_API_CONTENT_TYPE, 'application/json']);

    let documents: Document<T>[];
    if (isPromise(response)) {
      documents = await (response as Promise<Document<T>[]>);
    } else {
      documents = response;
    }

    const filteredDocuments = await Promise.all(
      documents.map(async ({id, attributes}) => {
        const filteredAttributes = await this._session.filterReadAttributes(
          this._resource,
          attributes
        );
        return {
          id,
          type: this._resource.slug,
          attributes: filteredAttributes
        };
      }
    ));

    const finalResponse = {
      data: filteredDocuments,
    };

    this._validator.assertResponse(
      this._resource.collectionResponseSchemaId,
      finalResponse
    );
    this._response = finalResponse;
    return this;
  }

  /**
   * Emit a raw JSON response without any filtering.
   *
   * @param response The response object, or a promise resolving to one.
   */
  public async raw(response: object | Promise<object>): Promise<this> {
    this.assertNotEmitted();
    this.chooseContentType('application/json');

    if (isPromise(response)) {
      this._response = await response;
    } else {
      this._response = response;
    }

    return this;
  }

  /**
   * Set the response content type from one or more choices to the one which
   * best matches the request's Accept header. If none of the content types
   * match, a HTTP 406 is thrown.
   *
   * @param contentType One or more content types to choose from.
   */
  private chooseContentType(contentType: string|string[]): void {
    this._contentType = assertAccepts(this._req, contentType);
  }

  /**
   * Throw an error if a response has already been emitted.
   */
  private assertNotEmitted(): void {
    if (this._response) {
      throw new Error('Reponse already emitted');
    }
  }
}
