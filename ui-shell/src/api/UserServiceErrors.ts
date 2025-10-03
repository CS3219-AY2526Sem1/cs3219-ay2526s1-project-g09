export class UserServiceApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserServiceApiError";
  }
}
