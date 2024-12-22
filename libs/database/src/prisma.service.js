"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const core_1 = require("../../core/src");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            log: [
                { emit: 'stdout', level: 'query' },
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
            ],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }
    async onModuleInit() {
        try {
            await this.executeWithRetry(() => this.$connect());
            this.logger.log('Successfully connected to database');
        }
        catch (error) {
            this.logger.error('Failed to connect to database', error.stack);
            throw new core_1.BaseException('Database connection failed', 'DATABASE_CONNECTION_ERROR', 500);
        }
    }
    async enableShutdownHooks(app) {
        process.on('beforeExit', async () => {
            await this.$disconnect();
            await app.close();
        });
    }
    async executeOperation(operation, options) {
        try {
            return await this.executeWithRetry(operation, options);
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async executeWithRetry(operation, options = { maxRetries: this.maxRetries, delay: this.retryDelay }) {
        let lastError = new Error('Operation failed');
        for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (this.shouldRetry(error) && attempt < options.maxRetries) {
                    this.logger.warn(`Attempt ${attempt} failed, retrying in ${options.delay}ms...`);
                    await this.delay(options.delay);
                    continue;
                }
                break;
            }
        }
        throw lastError;
    }
    shouldRetry(error) {
        const retryableCodes = [
            'P1001',
            'P1002',
            'P1008',
            'P1017',
            'P2024',
        ];
        return error?.code ? retryableCodes.includes(error.code) : false;
    }
    handleDatabaseError(error) {
        const errorMap = {
            P1001: ['Database connection failed', 'DATABASE_CONNECTION_ERROR', 500],
            P2002: ['Unique constraint violation', 'UNIQUE_CONSTRAINT_ERROR', 400],
            P2003: ['Foreign key constraint violation', 'FOREIGN_KEY_ERROR', 400],
            P2025: ['Record not found', 'NOT_FOUND_ERROR', 404],
            P2028: ['Transaction error', 'TRANSACTION_ERROR', 500],
        };
        const [message, code, status] = errorMap[error?.code] || [
            'Database operation failed',
            'DATABASE_OPERATION_ERROR',
            500,
        ];
        this.logger.error(`${message}: ${error.message}`, error.stack);
        throw new core_1.BaseException(message, code, status);
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map