import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto } from './dto/create-user.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, tenantId: string) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.bcpUser.create({
      data: {
        tenantId,
        username: dto.username,
        passwordHash,
        fullName: dto.fullName,
        email: dto.email,
        mobileNumber: dto.mobileNumber,
      },
      include: { userRoles: { include: { role: true } } },
    });
    return this.formatUser(user);
  }

  async findAll(tenantId: string) {
    const users = await this.prisma.bcpUser.findMany({
      where: { tenantId },
      include: { userRoles: { include: { role: true } } },
      orderBy: { username: 'asc' },
    });
    return users.map(this.formatUser);
  }

  async update(id: number, dto: UpdateUserDto, tenantId: string) {
    const user = await this.prisma.bcpUser.findFirst({
      where: { id: BigInt(id), tenantId },
    });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.bcpUser.update({
      where: { id: BigInt(id) },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        mobileNumber: dto.mobileNumber,
        isActive: dto.isActive,
      },
      include: { userRoles: { include: { role: true } } },
    });
    return this.formatUser(updated);
  }

  async assignRoles(userId: number, dto: AssignRolesDto, tenantId: string) {
    const user = await this.prisma.bcpUser.findFirst({
      where: { id: BigInt(userId), tenantId },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.bcpUserRole.deleteMany({
      where: { userId: BigInt(userId), tenantId },
    });

    for (const roleId of dto.roleIds) {
      await this.prisma.bcpUserRole.create({
        data: {
          tenantId,
          userId: BigInt(userId),
          roleId: BigInt(roleId),
        },
      });
    }

    const updated = await this.prisma.bcpUser.findUnique({
      where: { id: BigInt(userId) },
      include: { userRoles: { include: { role: true } } },
    });
    return this.formatUser(updated!);
  }

  private formatUser(user: any) {
    return {
      id: Number(user.id),
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      isActive: user.isActive,
      roles: user.userRoles?.map((ur: any) => ({
        id: Number(ur.role.id),
        roleCode: ur.role.roleCode,
        roleName: ur.role.roleName,
      })) || [],
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
