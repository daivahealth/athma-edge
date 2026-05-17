import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || process.env.DEFAULT_TENANT_ID || 'default-tenant';
    return { data: await this.authService.login(dto, tenantId) };
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@Req() req: any) {
    return { data: await this.authService.getProfile(req.user.sub, req.user.tenantId) };
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { data: { message: 'Logged out successfully' } };
  }
}
