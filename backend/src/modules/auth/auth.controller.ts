import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
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
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = this.getConfiguredTenantId();
    const authResult = await this.authService.login(dto, tenantId);

    res.cookie('bcp_session', authResult.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      // Secure exactly when the request arrived over HTTPS. 'trust proxy' is
      // set in main.ts, so this follows X-Forwarded-Proto when a hospital
      // terminates TLS in front of the stack. The previous NODE_ENV check was
      // never true — NODE_ENV is not set anywhere — so the session cookie was
      // never marked Secure, including behind TLS.
      secure: req.secure,
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
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('bcp_session', {
      httpOnly: true,
      sameSite: 'lax',
      // Secure exactly when the request arrived over HTTPS. 'trust proxy' is
      // set in main.ts, so this follows X-Forwarded-Proto when a hospital
      // terminates TLS in front of the stack. The previous NODE_ENV check was
      // never true — NODE_ENV is not set anywhere — so the session cookie was
      // never marked Secure, including behind TLS.
      secure: req.secure,
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
