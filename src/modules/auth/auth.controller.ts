import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import { AuthService } from './auth.service';
import { Token, User } from 'src/decorators/auth.decorator';
import { RequestUser } from 'src/database/schema';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RefreshRequestUser } from './auth.dto';

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

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@User() user: RefreshRequestUser, @Token() token: string) {
    return this.authService.refresh(user, token, user.familyId);
  }
}
