import { BaseCException } from "./BaseCException";

export class UnauthorizedCException extends BaseCException {
  constructor(message: string = "Unauthorized access.") {
    super(message, [message], 401);
  }
}

