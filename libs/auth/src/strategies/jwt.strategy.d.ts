import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@libs/core/user';
import { JwtPayload } from '../interfaces';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly userRepository;
    constructor(configService: ConfigService, userRepository: UserRepository);
    validate(payload: JwtPayload): Promise<any>;
}
export {};
