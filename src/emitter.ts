import { Resource } from './resource';
import { Session } from './session';

export class Emitter {
  private _resource: Resource;
  private _session: Session;
  private _response?: object;

  public get response(): object {
    if (!this._response) {
      throw new Error('No response emitted');
    }
    return this._response;
  }

  constructor(resource: Resource, session: Session) {
    this._resource = resource;
    this._session = session;
  }

  public async document(response: object): Promise<this> {
    this.assertNotEmitted();
    this._response = await this._session.filterDocumentRequest(this._resource, response);
    return this;
  }

  public async collection(response: object): Promise<this> {
    this.assertNotEmitted();
    this._response = await this._session.filterCollectionResponse(this._resource, response);
    return this;
  }

  public async raw(response: object): Promise<this> {
    this.assertNotEmitted();
    this._response = response;
    return this;
  }

  private async assertNotEmitted() {
    if (this._response) {
      throw new Error('Reponse already emitted');
    }
  }
}

/*
  async filterCollectionResponse(resource: Resource, collection: object): Promise<object> {
    const promises = Object.entries(collection).map(async ([id, document]) => {
      const filteredDocument = await this.filterDocumentResponse(resource, document);
      return { [id]: filteredDocument };
    });

    return (await Promise.all(promises)).reduce((acc, pair) => {
      return { ...acc, ...pair };
    }, {} as {[x: string]: object});
  };
*/

/*
  protected async _finalizeResponse(session: Session, validator: Validator, response: object): Promise<object> {
    // If this an individual document or a collection, filter out fields the session is not allowed
    // to read.
    if (this._responseFilter === 'document') {
      response = await session.filterDocumentResponse(this._resource, response);
    } else if (this._responseFilter === 'collection') {
      response = await session.filterCollectionResponse(this._resource, response);
    }

    // If a response contract is specified, make sure the response conforms to it
    if (this._responseContract) {
      validator.assertResponse(this._responseContract, response);
    }

    return response;
  }

*/
