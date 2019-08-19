import { suffixUrlFilename } from './utils';

describe('utils', () => {
  describe('suffixUrlFilename()', () => {
    let result = '';
    let error: any = null;

    beforeEach(() => {
      result = '';
      error = null;
    });

    it('works when given bare URL', () => {
      result = suffixUrlFilename('http://example.com', '-suffixed');
      expect(result).toBe('http://example.com/-suffixed');
    });

    it('works with file extension', () => {
      result = suffixUrlFilename('http://example.com/some-schema.json', '-suffixed');
      expect(result).toBe('http://example.com/some-schema-suffixed.json');
    });

    it('works with multiple extensions', () => {
      result = suffixUrlFilename('http://example.com/some.schema.json', '-suffixed');
      expect(result).toBe('http://example.com/some-suffixed.schema.json');
    });

    it('throws when given a non-url', () => {
      try {
        result = suffixUrlFilename('not a URL', '-suffixed');
      } catch (err) {
        error = err;
      }
      expect(result).toBe('');
      expect(error).toBeTruthy();
    });
  });
});
