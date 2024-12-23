import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserRepository } from '@libs/core/user';
import { JwtPayload } from '../interfaces';
declare const JwtRefreshStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private readonly userRepository;
    constructor(configService: ConfigService, userRepository: UserRepository);
    validate(req: Request, payload: JwtPayload): Promise<any>;
}
export {};
