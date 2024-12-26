export interface IEmailTemplate {
  name: string;
  version: string;
  subject: string;
  text?: string;
  html?: string;
}
