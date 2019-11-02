import { RestfulError } from './RestfulError';

export class UnsupportedMediaTypeError extends RestfulError {
  constructor(message = 'Unsupported Media Type') {
    super(415, message);
  }
}
