// libs/common/src/email/email-template.service.ts
import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailTemplateService {
  private readonly templatesDir = join(__dirname, 'templates');
  private templateCache: Record<string, HandlebarsTemplateDelegate> = {};

  async getTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache[name]) {
      return this.templateCache[name];
    }

    const templatePath = join(this.templatesDir, `${name}.hbs`);
    const templateContent = await readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    this.templateCache[name] = template;
    return template;
  }

  async renderTemplate(name: string, context: Record<string, any>): Promise<string> {
    const template = await this.getTemplate(name);
    return template(context);
  }
}