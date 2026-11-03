import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SeguridadService } from './seguridad.service.js';
import { LoginDto } from './dto/login.dto.js';

@Controller(['seguridad', 'auth'])
export class SeguridadController {
  constructor(private readonly seguridadService: SeguridadService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    return this.seguridadService.login(body.username, body.password, ip);
  }
}

