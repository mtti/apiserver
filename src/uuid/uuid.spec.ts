jest.mock('./is-uuid-string');
import * as original from './is-uuid-string';
import { Uuid } from './uuid';
import { VALID_UUID_V4 } from '../../test/constants';

const actual = jest.requireActual('./is-uuid-string');

describe('Uuid class', () => {
  let mock:jest.SpyInstance;

  afterEach(() => {
    if (mock) {
      mock.mockRestore();
    }
  });

  describe('new()', () => {
    describe('without an argument', () => {
      let result: any;

      beforeEach(() => {
        result = new Uuid();
      });

      it('creates an UUID', () => {
        expect(result).toBeInstanceOf(Uuid);
      });
    });

    describe('with an argument', () => {
      let result: any;
      let error: any;

      beforeEach(() => {
        result = undefined;
        error = undefined;
      });

      describe('when isUuidString returns false', () => {
        beforeEach(() => {
          mock = jest.spyOn(original, 'isUuidString');
          mock.mockImplementation(() => false);
        });

        beforeEach(() => {
          try {
            result = new Uuid('dummy value');
          } catch (err) {
            error = err;
          }
        });

        it('should throw an Error', () => {
          expect(error).toBeInstanceOf(Error);
        });

        it('should not return a result', () => {
          expect(result).not.toBeTruthy();
        });
      });

      describe('when isUuidString returns true', () => {
        beforeEach(() => {
          mock = jest.spyOn(original, 'isUuidString');
          mock.mockImplementation(() => true);
        });

        beforeEach(() => {
          try {
            result = new Uuid('dummy value');
          } catch (err) {
            error = err;
          }
        });

        it('should not throw', () => {
          expect(error).toBeFalsy();
        });

        it('creates an UUID', () => {
          expect(result).toBeInstanceOf(Uuid);
        });
      });
    });
  });

  describe('toString()', () => {
    let result: string;

    beforeEach(() => {
      mock = jest.spyOn(original, 'isUuidString');
      mock.mockImplementation((...args) => actual.isUuidString(...args));
    });

    describe('when created with a lower case UUID', () => {
      beforeEach(() => {
        result = (new Uuid(VALID_UUID_V4.toLowerCase())).toString();
      });

      it('returns UUID in lower case', () => {
        expect(result).toEqual(VALID_UUID_V4.toLowerCase());
      });
    });

    describe('when created with an upper case UUID', () => {
      beforeEach(() => {
        result = (new Uuid(VALID_UUID_V4.toUpperCase())).toString();
      });

      it('returns UUID in lower case', () => {
        expect(result).toEqual(VALID_UUID_V4.toLowerCase());
      });
    });
  });

  describe('toJSON()', () => {
    let result: string;

    beforeEach(() => {
      mock = jest.spyOn(original, 'isUuidString');
      mock.mockImplementation((...args) => actual.isUuidString(...args));
    });

    describe('when created with a lower case UUID', () => {
      beforeEach(() => {
        result = (new Uuid(VALID_UUID_V4.toLowerCase())).toJSON();
      });

      it('returns UUID in lower case', () => {
        expect(result).toEqual(VALID_UUID_V4.toLowerCase());
      });
    });

    describe('when created with an upper case UUID', () => {
      beforeEach(() => {
        result = (new Uuid(VALID_UUID_V4.toUpperCase())).toJSON();
      });

      it('returns UUID in lower case', () => {
        expect(result).toEqual(VALID_UUID_V4.toLowerCase());
      });
    });
  });
});
