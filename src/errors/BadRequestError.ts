import { RestfulError } from './RestfulError';

export class BadRequestError extends RestfulError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}
