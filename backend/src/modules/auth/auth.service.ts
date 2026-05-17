import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/types/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, tenantId: string) {
    const user = await this.prisma.bcpUser.findUnique({
      where: {
        uq_user_tenant_username: {
          tenantId,
          username: dto.username,
        },
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const roles = user.userRoles.map((ur) => ur.role.roleCode);

    const payload: JwtPayload = {
      sub: Number(user.id),
      username: user.username,
      tenantId,
      roles,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.bcpUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      user: {
        id: Number(user.id),
        username: user.username,
        fullName: user.fullName,
        tenantId,
        roles,
      },
    };
  }

  async getProfile(userId: number, tenantId: string) {
    const user = await this.prisma.bcpUser.findUnique({
      where: { id: BigInt(userId) },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: Number(user.id),
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.userRoles.map((ur) => ur.role.roleCode),
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
