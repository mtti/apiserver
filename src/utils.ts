import * as url from 'url';

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
