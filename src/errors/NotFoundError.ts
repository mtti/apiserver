import { RestfulError } from './RestfulError';

export class NotFoundError extends RestfulError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}
