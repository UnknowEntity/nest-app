import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import { AuthnService } from './authn.service';
import { Token, User } from 'src/decorators/auth.decorator';
import { RequestUser } from 'src/database/schema';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RefreshRequestUser, ReqSignUpDto, ReqSignUpSchema } from './authn.dto';
import { ZodValidationPipe } from 'src/pipes/validation.pipe';

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

  @Post('signup')
  @UsePipes(new ZodValidationPipe(ReqSignUpSchema))
  signup(@Body() body: ReqSignUpDto) {
    return this.authService.signup(body);
  }
}
