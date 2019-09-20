import express from 'express';
import { JSON_API_CONTENT_TYPE, JsonApiRequestEnvelope } from './json-api/json-api';
import { RequestDocument } from './Document';
import { Validator } from './validator';
import { UnsupportedMediaTypeError } from './errors';

export function expectJsonApiRequest<T>(
  validator: Validator,
  jsonSchemaId: string,
  req: express.Request,
): RequestDocument<T> {
  // Incoming documents should always be JSON:API requests
  if (!req.is(JSON_API_CONTENT_TYPE)) {
    throw new UnsupportedMediaTypeError();
  }

  // Always validate against the resource's document request schema when
  // the action expects to receive a document.
  const envelope = validator.assertRequestBody<JsonApiRequestEnvelope<T>>(
    jsonSchemaId,
    req.body,
  );

  return envelope.data;
}
