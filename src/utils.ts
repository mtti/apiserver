import express = require('express');
import * as url from 'url';
import { Dictionary } from './types';
import { NotAcceptableError } from './errors';

/**
 * Add a suffix to the filename in an URL.
 *
 * @param original The original schema ID
 * @param suffix The suffix to add to the end of `original`
 */
export function suffixUrlFilename(original: string, suffix: string): string {
  const originalUrl = new url.URL(original);
  const pathParts = originalUrl.pathname.split('/');
  const filename = pathParts.slice(-1)[0];
  const fileParts = filename.split('.');

  fileParts[0] = `${fileParts[0]}${suffix}`;
  pathParts[pathParts.length -1] = fileParts.join('.');
  originalUrl.pathname = pathParts.join('/');

  return originalUrl.toString();
}

/**
 * Check if `value` is a promise.
 *
 * @param value The value to check
 */
export function isPromise(value: any): value is Promise<any> {
  return value && (value as Promise<any>).then !== undefined;
}

/**
 * Construct an object from an array of key-value pairs.
 *
 * @param entries
 */
export function fromEntries<T>(entries: [string, T][]): Dictionary<T> {
  return entries
    .reduce((
      result,
      [key, value]) => ({ ...result, [key]: value}),
      ({} as Dictionary<T>)
    );
}

/**
 * Return `value` if it's an array, or an array with just `value` if it's not.
 *
 * @param value
 */
export function toArray<T>(value: T|T[]): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [ value ];
}

/**
 * Throws a `406 Not Acceptable` error if the express request does not accept
 * any of the content types. Otherwise, the best match is returned.
 *
 * @param req
 * @param contentTypes
 */
export function assertAccepts(
  req: express.Request,
  contentType: string|string[]
): string {
  const contentTypes = toArray(contentType);
  const match = req.accepts(contentTypes);
  if (!match) {
    throw new NotAcceptableError();
  }
  return match;
}
