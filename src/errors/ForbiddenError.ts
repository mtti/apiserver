import { RestfulError } from './RestfulError';

export class ForbiddenError extends RestfulError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}
