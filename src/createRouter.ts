import bodyParser from 'body-parser';
import express from 'express';
import { wrapHandler } from './handler';
import { JSON_API_CONTENT_TYPE } from './json-api';
import { Validator } from './validator';
import { NotFoundError } from './errors';
import { JsonSchema } from './types';
import { expectJsonApiRequest } from './expectJsonApiRequest';
import { generateSchemas } from './generateSchemas';
import { errorHandler, notFoundHandler } from './error-handler';
import { emitOne } from './emitOne';
import { emitMany } from './emitMany';
import { assertUuid } from './uuid';
import { Document } from './Document';
import { SessionParser } from './SessionParser';
import { Resource } from './Resource';

const jsonParser = bodyParser.json({
  type: ['application/json', JSON_API_CONTENT_TYPE]
});

export type RouterOptions<T> = {
  slug: string;
  schema: JsonSchema;
  sessionParser: SessionParser;
};

/**
 * Create an Express router for accessing a resource.
 *
 * @param validator
 * @param options
 */
export function createRouter<T extends Record<string, unknown>>(
  validator: Validator,
  resource: Resource<T, unknown>,
  options: RouterOptions<T>,
): express.Router {
  const attributeSchemaId = options.schema['$id'];
  const {
    documentRequestSchemaId,
    collectionResponseSchemaId,
    documentResponseSchemaId
  } = generateSchemas(validator, options.slug, attributeSchemaId);
  const { sessionParser } = options;

  const router = express.Router();

  // Create
  router.post('/', jsonParser, wrapHandler(async (req: express.Request) => {
    const session = await sessionParser(req);
    const document = expectJsonApiRequest<T>(
      validator,
      documentRequestSchemaId,
      req,
    );
    const newDocument = await resource.create(session, document.attributes);
    return emitOne(validator, documentResponseSchemaId, newDocument);
  }));

  // Read
  router.get('/:id', wrapHandler(async (req: express.Request) => {
    const session = await sessionParser(req);
    const id = assertUuid(req.params.id);

    const document = await resource.read(session, id.toString());
    if (!document) {
      throw new NotFoundError();
    }

    return emitOne(validator, documentResponseSchemaId, document);
  }));

  // Replace
  router.put('/:id', jsonParser, wrapHandler(async (req: express.Request) => {
    const session = await sessionParser(req);
    const id = assertUuid(req.params.id);
    const document = expectJsonApiRequest<T>(
      validator,
      documentRequestSchemaId,
      req,
    );

    const result = await resource.replace(
      session,
      id.toString(),
      document.attributes
    );

    return emitOne(validator, documentResponseSchemaId, result);
  }));

  // Patch
  router.patch('/:id', jsonParser, wrapHandler(async (req: express.Request) => {

  }));

  // Destroy
  router.delete('/:id', wrapHandler(async (req: express.Request) => {
    const session = await sessionParser(req);
    const id = assertUuid(req.params.id);

    await resource.destroy(session, id.toString());
  }));

  // List
  router.get('/', wrapHandler(async (req: express.Request) => {
    const session = await sessionParser(req);

    const documents: Document<T>[] = await resource.list(session, {});

    return emitMany(validator, collectionResponseSchemaId, documents);
  }));

  router.use(errorHandler);
  router.use(notFoundHandler);

  return router;
}
