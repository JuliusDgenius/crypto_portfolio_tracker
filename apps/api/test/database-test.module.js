"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseTestModule = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@lib/database");
const database_2 = require("@lib/database");
let DatabaseTestModule = class DatabaseTestModule {
};
exports.DatabaseTestModule = DatabaseTestModule;
exports.DatabaseTestModule = DatabaseTestModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: database_1.PrismaService,
                useValue: {
                    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
                    $connect: jest.fn(),
                    $disconnect: jest.fn(),
                },
            },
            {
                provide: database_2.DatabaseHealthIndicator,
                useValue: {
                    isHealthy: jest.fn().mockResolvedValue({
                        database: {
                            status: 'up'
                        }
                    })
                }
            }
        ],
        exports: [database_1.PrismaService, database_2.DatabaseHealthIndicator],
    })
], DatabaseTestModule);
//# sourceMappingURL=database-test.module.js.map