export declare class EmailTemplateService {
    private readonly templatesDir;
    private templateCache;
    getTemplate(name: string): Promise<HandlebarsTemplateDelegate>;
    renderTemplate(name: string, context: Record<string, any>): Promise<string>;
}
