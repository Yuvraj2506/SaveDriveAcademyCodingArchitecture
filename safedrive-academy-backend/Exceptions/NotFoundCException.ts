import { BaseCException } from "./BaseCException";

export class NotFoundCException extends BaseCException {
  constructor(message: string = "Resource not found.") {
    super(message, [message], 404);
  }
}

