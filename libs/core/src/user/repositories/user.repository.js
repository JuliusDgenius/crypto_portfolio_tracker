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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@libs/database");
const password_service_1 = require("../services/password.service");
let UserRepository = class UserRepository {
    constructor(prisma, passwordService) {
        this.prisma = prisma;
        this.passwordService = passwordService;
    }
    async create(dto) {
        if (!dto.email || !dto.password) {
            throw new Error('Email and password are required.');
        }
        const hashedPassword = await this.passwordService.hash(dto.password);
        return this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name || null,
                verified: false,
                twoFactorEnabled: false,
                password: hashedPassword,
                preferences: {
                    currency: 'USD',
                    theme: 'light',
                    notifications: {
                        email: true,
                        push: false,
                        priceAlerts: false,
                    },
                },
            },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findByUsername(username) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }
    async update(id, dto) {
        return this.prisma.user.update({
            where: { id },
            data: dto,
        });
    }
    async updatePassword(id, hashedPassword) {
        return this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }
    async verifyEmail(id) {
        return this.prisma.user.update({
            where: { id },
            data: { verified: true },
        });
    }
    async toggle2FA(id, enabled) {
        return this.prisma.user.update({
            where: { id },
            data: { twoFactorEnabled: enabled },
        });
    }
    async updatePreferences(id, preferences) {
        const user = await this.findById(id);
        return this.prisma.user.update({
            where: { id },
            data: {
                preferences: {
                    ...user.preferences,
                    ...preferences,
                },
            },
        });
    }
    async invalidateRefreshToken(userId) {
    }
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object, password_service_1.PasswordService])
], UserRepository);
//# sourceMappingURL=user.repository.js.map