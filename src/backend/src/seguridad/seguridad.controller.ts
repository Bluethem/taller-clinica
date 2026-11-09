import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthenticatedGuard } from './guards/authenticated.guard.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import {
  createSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from './session.config.js';

@Controller(['seguridad', 'auth'])
export class SeguridadController {
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  login(@Req() request: Request) {
    return { success: true, user: request.user };
  }

  @Post('logout')
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    return new Promise((resolve, reject) => {
      request.logout((logoutError) => {
        if (logoutError) {
          reject(logoutError);
          return;
        }
        request.session.destroy((destroyError) => {
          if (destroyError) {
            reject(destroyError);
            return;
          }
          response.clearCookie(
            SESSION_COOKIE_NAME,
            createSessionCookieOptions(),
          );
          resolve({ success: true });
        });
      });
    });
  }

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  me(@Req() request: Request) {
    return { user: request.user };
  }
}
