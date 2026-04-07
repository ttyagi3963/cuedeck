export class InfrastructureError extends Error {
  constructor(
    message: string,
    public readonly code = "INFRASTRUCTURE_ERROR",
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
