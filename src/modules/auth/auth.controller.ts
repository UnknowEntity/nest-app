import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import { AuthService } from './auth.service';
import { User } from 'src/decorators/user.decorator';
import { RequestUser } from 'src/database/schema';
import { JwtAccessGuard } from './guards/jwt-access.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@User() user: RequestUser) {
    return this.authService.login(user);
  }

  @UseGuards(JwtAccessGuard)
  @Get('profile')
  profile(@User() user: RequestUser) {
    return user;
  }
}
