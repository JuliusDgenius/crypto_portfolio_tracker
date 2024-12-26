// libs/common/src/email/email-template.service.ts
import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailTemplateService {
  private readonly templatesDir;
  private templateCache: Record<string, HandlebarsTemplateDelegate> = {};

  constructor() {
    this.templatesDir = join(__dirname, '..', 'templates');
    console.log('Debug information:', {
      dirname: __dirname,
      resolvedTemplatesDir: this.templatesDir,
      cwd: process.cwd()
    });
  }

  async getTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache[name]) {
      return this.templateCache[name];
    }

    const templatePath = join(this.templatesDir, `${name}.hbs`);
    console.log('Template resolution:', {
      templateName: name,
      attemptedPath: templatePath
    });

    try {
      const templateContent = await readFile(templatePath, 'utf-8');
      console.log(`Successfully loaded template: ${name}`);
      const template = Handlebars.compile(templateContent);
      this.templateCache[name] = template;
      return template;
    } catch(error) {
      console.error('Failed to load template:', {
        templateName: name,
        attemptedPath: templatePath,
        error: error.message
      });
      throw error;
    }
  }

  async renderTemplate(name: string, context: Record<string, any>): Promise<string> {
    const template = await this.getTemplate(name);
    return template(context);
  }
}