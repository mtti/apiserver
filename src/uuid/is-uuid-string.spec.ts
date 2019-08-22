import { isUuidString, UuidVersion } from './is-uuid-string';

const VALID_UUID_V4 = 'f4d35e33-7b5d-49f6-9a61-1f1bc3738929';
const VALID_UUID_V5 = '4be0643f-1d98-573b-97cd-ca98a65347dd';

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
