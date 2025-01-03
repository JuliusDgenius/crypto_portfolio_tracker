import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../database/src';
import { ConfigService } from '../../../config/src';
import { JwtSecretType } from '../strategies';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshGuard.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private config: ConfigService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await super.canActivate(context);
      if (!result) {
        this.logger.debug('Passport strategy validation failed');
        throw new UnauthorizedException('Invalid refresh token');
      }
  
      const request = context.switchToHttp().getRequest();
      this.logger.debug(`Request user: ${JSON.stringify(request.user)}`);
      
      if (!request.user) {
        this.logger.debug('No user attached to request');
        throw new UnauthorizedException('User not found in request');
      }
  
      // Add more detailed logging
      const tokenExists = await this.prisma.refreshToken.findFirst({
        where: {
          userId: request.user.id,
          tokenHash: request.user.refreshToken,
          isRevoked: false
        }
      });
  
      this.logger.debug(`Token exists: ${!!tokenExists}`);
      
      if (!tokenExists) {
        this.logger.debug('Refresh token not found in database');
        throw new UnauthorizedException('Invalid refresh token');
      }
  
      return true;
    } catch (error) {
      this.logger.error('Error in refresh guard:', error.stack);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}