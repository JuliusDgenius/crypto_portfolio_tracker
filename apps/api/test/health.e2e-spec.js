"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = __importStar(require("supertest"));
const health_module_1 = require("../src/health/health.module");
const database_test_module_1 = require("./database-test.module");
const terminus_1 = require("@nestjs/terminus");
describe('Health Check (e2e)', () => {
    let app;
    beforeEach(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            imports: [
                terminus_1.TerminusModule,
                database_test_module_1.DatabaseTestModule,
                {
                    module: health_module_1.HealthModule,
                    imports: [database_test_module_1.DatabaseTestModule]
                }
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
    });
    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });
    it('/health (GET)', () => {
        return request(app.getHttpServer())
            .get('/health')
            .expect(200)
            .expect((res) => {
            expect(res.body.status).toBe('ok');
            expect(res.body.info.database.status).toBe('up');
        });
    });
});
//# sourceMappingURL=health.e2e-spec.js.map