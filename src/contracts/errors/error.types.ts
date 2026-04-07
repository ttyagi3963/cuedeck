export class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly code = "DOMAIN_ERROR",
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, message = `${resource} not found`) {
    super(message, 404, "NOT_FOUND");
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string, code = "BUSINESS_RULE_ERROR") {
    super(message, 400, code);
  }
}
