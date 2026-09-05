import { BaseCException } from "./BaseCException";

export class ValidationCException extends BaseCException {
  constructor(messageOrErrors: string | string[], statusCode: number = 400) {
    if (Array.isArray(messageOrErrors)) {
      super(messageOrErrors[0] || "Validation failed.", messageOrErrors, statusCode);
    } else {
      super(messageOrErrors, [messageOrErrors], statusCode);
    }
  }
}

