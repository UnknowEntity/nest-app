import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import { AuthnService } from './authn.service';
import { Token, User } from 'src/decorators/auth.decorator';
import { RequestUser } from 'src/database/schema';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RefreshRequestUser } from './authn.dto';

@Controller('auth')
export class AuthnController {
  constructor(private readonly authService: AuthnService) {}

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
