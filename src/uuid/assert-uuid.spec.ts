jest.mock('./is-uuid-string');
import * as original from './is-uuid-string';
import { assertUuid } from './assert-uuid';
import { Uuid } from './uuid';
import { BadRequestError } from '../errors';

const VALID_UUID_V4 = 'f4d35e33-7b5d-49f6-9a61-1f1bc3738929';


describe('assertUuid()', () => {
  let result: any;
  let error: any;
  let mock:jest.SpyInstance;

  beforeEach(() => {
    result = undefined;
    error = undefined;
  });

  afterEach(() => {
    mock.mockRestore();
  });

  describe('when isUuidString returns false', () => {
    beforeEach(() => {
      mock = jest.spyOn(original, 'isUuidString');
      mock.mockImplementation(() => false);
    });

    beforeEach(() => {
      try {
        result = assertUuid(VALID_UUID_V4);
      } catch (err) {
        error = err;
      }
    });

    it('should throw a BadRequestError', () => {
      expect(error).toBeInstanceOf(BadRequestError);
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
        result = assertUuid(VALID_UUID_V4);
      } catch (err) {
        error = err;
      }
    });

    it('should not throw an exception', () => {
      expect(error).not.toBeTruthy();
    });

    it('should return an UUID instance', () => {
      expect(result).toBeInstanceOf(Uuid);
    });
  });
});
