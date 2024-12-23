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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const common_2 = require("@libs/common");
const core_1 = require("@libs/core");
let AuthService = class AuthService {
    constructor(userRepository, passwordService, jwtService, configService, emailService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async register(dto) {
        const user = await this.userRepository.create(dto);
        const token = this.generateVerificationToken(user.id);
        await this.emailService.sendVerificationEmail(user.email, token);
    }
    async login(dto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await this.passwordService.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.verified) {
            throw new common_1.UnauthorizedException('Please verify your email first');
        }
        return this.generateTokens(user);
    }
    async verifyEmail(dto) {
        const payload = this.jwtService.verify(dto.token, {
            secret: this.configService.get('JWT_VERIFICATION_SECRET'),
        });
        await this.userRepository.verifyEmail(payload.sub);
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.generateTokens(user);
    }
    async resetPassword(dto) {
        const payload = this.jwtService.verify(dto.token, {
            secret: this.configService.get('JWT_RESET_SECRET'),
        });
        const hashedPassword = await this.passwordService.hash(dto.newPassword);
        await this.userRepository.updatePassword(payload.sub, hashedPassword);
    }
    async logout(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        await this.userRepository.invalidateRefreshToken(userId);
    }
    generateVerificationToken(userId) {
        return this.jwtService.sign({ sub: userId }, {
            secret: this.configService.get('JWT_VERIFICATION_SECRET'),
            expiresIn: '1d',
        });
    }
    generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '15m',
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
        return {
            accessToken,
            refreshToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.UserRepository !== "undefined" && core_1.UserRepository) === "function" ? _a : Object, typeof (_b = typeof core_1.PasswordService !== "undefined" && core_1.PasswordService) === "function" ? _b : Object, jwt_1.JwtService,
        config_1.ConfigService, typeof (_c = typeof common_2.EmailService !== "undefined" && common_2.EmailService) === "function" ? _c : Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map