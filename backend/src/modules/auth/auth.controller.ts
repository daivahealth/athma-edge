import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
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
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tenantId = this.getConfiguredTenantId();
    const authResult = await this.authService.login(dto, tenantId);

    res.cookie('bcp_session', authResult.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      data: {
        user: authResult.user,
      },
    };
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@Req() req: any) {
    return { data: await this.authService.getProfile(req.user.sub, req.user.tenantId) };
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('bcp_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return { data: { message: 'Logged out successfully' } };
  }

  private getConfiguredTenantId(): string {
    const tenantId = process.env.DEFAULT_TENANT_ID?.trim();

    if (!tenantId) {
      throw new Error('DEFAULT_TENANT_ID must be configured');
    }

    return tenantId;
  }
}
