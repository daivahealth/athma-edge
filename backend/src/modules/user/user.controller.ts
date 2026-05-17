import { Controller, Post, Get, Patch, Body, Param, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto } from './dto/create-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto, @Req() req: any) {
    return { data: await this.userService.create(dto, req.user.tenantId) };
  }

  @Get()
  async findAll(@Req() req: any) {
    return { data: await this.userService.findAll(req.user.tenantId) };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ) {
    return { data: await this.userService.update(id, dto, req.user.tenantId) };
  }

  @Post(':id/roles')
  async assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRolesDto,
    @Req() req: any,
  ) {
    return { data: await this.userService.assignRoles(id, dto, req.user.tenantId) };
  }
}
