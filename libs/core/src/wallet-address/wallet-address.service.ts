import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { CreateWalletAddressDto } from './dto';

@Injectable()
export class WalletAddressService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWalletAddressDto) {
    // Check for existing address for this user/blockchain
    const existing = await this.prisma.walletAddress.findFirst({
      where: {
        userId,
        blockchain: dto.blockchain,
        address: dto.address,
      },
    });
    if (existing) {
      throw new ConflictException('This wallet address is already added');
    }
    return this.prisma.walletAddress.create({
      data: {
        userId,
        blockchain: dto.blockchain,
        address: dto.address,
        label: dto.label,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.walletAddress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const wallet = await this.prisma.walletAddress.findFirst({ where: { id, userId } });
    if (!wallet) throw new NotFoundException('Wallet address not found');
    await this.prisma.walletAddress.delete({ where: { id } });
  }
} 