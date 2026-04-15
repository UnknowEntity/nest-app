export class ResetPasswordEvent {
  name: string;
  email: string;
  token: string;

  constructor({
    name,
    email,
    token,
  }: {
    name: string;
    email: string;
    token: string;
  }) {
    this.name = name;
    this.email = email;
    this.token = token;
  }
}
