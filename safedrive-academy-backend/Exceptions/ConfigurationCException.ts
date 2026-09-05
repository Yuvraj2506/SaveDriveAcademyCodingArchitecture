import { BaseCException } from "./BaseCException";

export class ConfigurationCException extends BaseCException {
  constructor(message: string) {
    super(message, [message], 500);
  }
}

