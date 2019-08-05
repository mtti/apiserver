import { isUuidString, UuidVersion } from './is-uuid-string';
import { VALID_UUID_V4, VALID_UUID_V5 } from '../../test/constants';

//import * as original from './uuid';

//const mocked = original as jest.Mocked<typeof original>;

/*
import * as original from './services/implementation/authentication.service';  // import module
jest.mock('./services/implementation/authentication.service');

const mocked = original as jest.Mocked<typeof original>;  // Let TypeScript know mocked is an auto-mock of the module
const AuthenticationService = mocked.default;  // AuthenticationService has correct TypeScript typing

beforeEach(() => {
  AuthenticationService.mockClear();
});

it('test', () => {

    // mock.instances is available with automatic mocks:
    const authServerInstance = AuthenticationService.mock.instances[0];

*/

describe('UUIDs', () => {
  describe('isUuidString()', () => {
    let result: boolean|undefined;

    beforeEach(() => {
      result = undefined;
    });

    describe('with non-string', () => {
      beforeEach(() => {
        result = isUuidString(1234);
      });

      it('returns false', () => {
        expect(result).toStrictEqual(false);
      });
    });

    describe('with non-UUID string', () => {
      beforeEach(() => {
        result = isUuidString('1234');
      });

      it('returns false', () => {
        expect(result).toStrictEqual(false);
      });
    });

    describe('set to any version', () => {
      describe('with version 4 UUID string', () => {
        beforeEach(() => {
          result = isUuidString(VALID_UUID_V4);
        });

        it('returns true', () => {
          expect(result).toStrictEqual(true);
        });
      });

      describe('with version 5 UUID string', () => {
        beforeEach(() => {
          result = isUuidString(VALID_UUID_V5);
        });

        it('returns true', () => {
          expect(result).toStrictEqual(true);
        });
      });
    });

    describe('set to version 4', () => {
      describe('with version 4 UUID string', () => {
        beforeEach(() => {
          result = isUuidString(VALID_UUID_V4, UuidVersion.V4);
        });

        it('returns true', () => {
          expect(result).toStrictEqual(true);
        });
      });

      describe('with version 5 UUID string', () => {
        beforeEach(() => {
          result = isUuidString(VALID_UUID_V5, UuidVersion.V4);
        });

        it('returns false', () => {
          expect(result).toStrictEqual(false);
        });
      });
    });

    describe('set to version 5', () => {
      describe('with version 4 UUID string', () => {
        beforeEach(() => {
          result = isUuidString(VALID_UUID_V4, UuidVersion.V5);
        });

        it('returns true', () => {
          expect(result).toStrictEqual(false);
        });
      });

      describe('with version 5 UUID string', () => {
        beforeEach(() => {
          result = isUuidString(VALID_UUID_V5, UuidVersion.V5);
        });

        it('returns false', () => {
          expect(result).toStrictEqual(true);
        });
      });
    });
  });
});
