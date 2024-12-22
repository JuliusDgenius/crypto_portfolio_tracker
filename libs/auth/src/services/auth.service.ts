import { 
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
    Logger
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { PrismaService } from '@lib/database';
  import { ConfigService } from '@lib/config';
  import { compare, hash } from 'bcrypt';
  import { v4 as uuidv4 } from 'uuid';
  import { RegisterDto } from '../shared/dtos/register.dto';
  import { LoginDto } from '../shared/dtos/login.dto';
  import { Tokens } from '../shared/interfaces/tokens.interface';
  
  @Injectable()
  export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly SALT_ROUNDS = 10;
  
    constructor(
      private readonly prisma: PrismaService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}
  
    /**
     * Registers a new user with email verification
     * @param registerDto User registration data
     * @returns Created user (without password)
     */
    async register(registerDto: RegisterDto) {
      const { email, password, name } = registerDto;
  
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email }
      });
  
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
  
      // Generate verification token
      const verificationToken = uuidv4();
  
      try {
        // Hash password and create user
        const hashedPassword = await hash(password, this.SALT_ROUNDS);
        
        const user = await this.prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verified: false
          },
          select: {
            id: true,
            email: true,
            name: true,
            verified: true,
            createdAt: true
          }
        });
  
        // TODO: Send verification email using EmailService
        
        return user;
      } catch (error) {
        this.logger.error(`Registration failed: ${error.message}`, error.stack);
        throw new BadRequestException('Registration failed');
      }
    }
  
    /**
     * Authenticates a user and returns JWT tokens
     * @param loginDto Login credentials
     * @returns Access and refresh tokens
     */
    async login(loginDto: LoginDto): Promise<Tokens> {
      const { email, password } = loginDto;
  
      // Find user and include refresh token for validation
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          verified: true,
          twoFactorEnabled: true,
          twoFactorSecret: true
        }
      });
  
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      // Verify password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      // Check if email is verified
      if (!user.verified) {
        throw new UnauthorizedException('Please verify your email first');
      }
  
      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email);
  
      // Update refresh token in database
      await this.updateRefreshToken(user.id, tokens.refreshToken);
  
      return tokens;
    }
  
    /**
     * Logs out a user by removing their refresh token
     * @param userId User ID
     */
    async logout(userId: string): Promise<void> {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null }
      });
    }
  
    /**
     * Refreshes the access token using a valid refresh token
     * @param userId User ID
     * @param refreshToken Current refresh token
     * @returns New access and refresh tokens
     */
    async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
  
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Access denied');
      }
  
      // Verify refresh token
      const refreshTokenMatches = await compare(
        refreshToken,
        user.refreshToken
      );
  
      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Access denied');
      }
  
      const tokens = await this.generateTokens(user.id, user.email);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
  
      return tokens;
    }
  
    /**
     * Generates new access and refresh tokens
     * @param userId User ID
     * @param email User email
     * @returns Access and refresh tokens
     */
    private async generateTokens(userId: string, email: string): Promise<Tokens> {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(
          {
            sub: userId,
            email,
          },
          {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: '15m',
          },
        ),
        this.jwtService.signAsync(
          {
            sub: userId,
            email,
          },
          {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
          },
        ),
      ]);
  
      return {
        accessToken,
        refreshToken,
      };
    }
  
    /**
     * Updates user's refresh token in database
     * @param userId User ID
     * @param refreshToken New refresh token
     */
    private async updateRefreshToken(
      userId: string,
      refreshToken: string,
    ): Promise<void> {
      // Hash refresh token before storing
      const hashedRefreshToken = await hash(refreshToken, this.SALT_ROUNDS);
      
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          refreshToken: hashedRefreshToken,
          lastLogin: new Date()
        },
      });
    }
  }