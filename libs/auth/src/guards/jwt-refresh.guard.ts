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
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}