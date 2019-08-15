import { IDocument } from './document';
import { JsonApiResponseEnvelope } from './json-api';
import { Resource } from './resource';
import { Session } from './session';
import { isPromise } from './utils';
import { Validator } from './validator';

export class Emitter<T> {
  private _validator: Validator;
  private _resource: Resource;
  private _session: Session;
  private _response?: JsonApiResponseEnvelope<T>;

  public get response(): object {
    if (!this._response) {
      throw new Error('No response emitted');
    }
    return this._response;
  }

  constructor(validator: Validator, resource: Resource, session: Session) {
    this._validator = validator;
    this._resource = resource;
    this._session = session;
  }

  /**
   * Emit a single document
   *
   * @param response
   */
  public async document(response: IDocument<T> | Promise<IDocument<T>>): Promise<this> {
    this.assertNotEmitted();

    let document: IDocument<T>;
    if (isPromise(response)) {
      document = await (response as Promise<IDocument<T>>);
    } else {
      document = response;
    }

    const finalResponse = {
      data: {
        id: document.id,
        type: this._resource.slug,
        attributes: await this._session.filterReadAttributes<T>(this._resource, document.attributes),
      }
    }

    this._validator.assertResponse(this._resource.documentResponseSchemaId, finalResponse);
    this._response = finalResponse;
    return this;
  }

  /**
   * Emit a collection of documents.
   *
   * @param response
   */
  public async collection(response: IDocument<T>[] | Promise<IDocument<T>[]>): Promise<this> {
    this.assertNotEmitted();

    let documents: IDocument<T>[];
    if (isPromise(response)) {
      documents = await (response as Promise<IDocument<T>[]>);
    } else {
      documents = response;
    }

    const filteredDocuments = await Promise.all(documents.map(async ({id, attributes}) => {
      const filteredAttributes
        = await this._session.filterReadAttributes(this._resource, attributes);
      return {
        id,
        type: this._resource.slug,
        attributes: filteredAttributes
      };
    }));

    const finalResponse = {
      data: filteredDocuments,
    };

    this._validator.assertResponse(this._resource.collectionResponseSchemaId, finalResponse);
    this._response = finalResponse;
    return this;
  }

  public async raw(response: object | Promise<object>): Promise<this> {
    this.assertNotEmitted();

    if (isPromise(response)) {
      this._response = await response;
    } else {
      this._response = response;
    }

    return this;
  }

  /**
   * Throw an error if a response has already been emitted.
   */
  private async assertNotEmitted() {
    if (this._response) {
      throw new Error('Reponse already emitted');
    }
  }
}
