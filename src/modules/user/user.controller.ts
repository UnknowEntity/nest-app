import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/validation.pipe';
import { ReqCreateUserDto, ReqCreateUserSchema } from './user.dto';
import { UserService } from './user.service';
import { EmailVerifiedGuard } from '../authn/guards/email-verified.guard';

@Controller('users')
@UseGuards(EmailVerifiedGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ReqCreateUserSchema))
  create(@Body() body: ReqCreateUserDto) {
    return this.userService.create(body);
  }
}
