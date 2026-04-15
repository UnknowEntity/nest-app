import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import {
  RefreshRequestUser,
  ReqForgotPasswordDto,
  ReqForgotPasswordSchema,
  ReqResetPasswordDto,
  ReqResetPasswordSchema,
  ReqSignUpDto,
  ReqSignUpSchema,
} from './authn.dto';
import { ZodValidationPipe } from 'src/pipes/validation.pipe';
import { Throttle } from '@nestjs/throttler';
import { AuthnThrottleConfig } from 'src/constants/auth.constant';
import { JwtResetPasswordGuard } from './guards/jwt-reset-password.guard';

@Controller('auth')
export class AuthnController {
  constructor(private readonly authService: AuthnService) {}

  @Throttle({ default: AuthnThrottleConfig })
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

  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtRefreshGuard)
  @Get('logout')
  logout(@User() user: RefreshRequestUser) {
    return this.authService.logout(user.id, user.familyId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(ReqForgotPasswordSchema))
  forgotPassword(@Body() body: ReqForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @UseGuards(JwtResetPasswordGuard)
  @UsePipes(new ZodValidationPipe(ReqResetPasswordSchema))
  async resetPassword(
    @User() user: RefreshRequestUser,
    @Body() dto: ReqResetPasswordDto,
    @Token() token: string,
  ) {
    await this.authService.resetPassword(user.id, token, dto.newPassword);

    return {
      message: 'Password reset successful',
    };
  }
}
