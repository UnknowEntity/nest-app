import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/validation.pipe';
import { ReqCreateUserDto, ReqCreateUserSchema } from './user.dto';
import { AuthzGuard } from '../authz/authz.guard';
import { UserService } from './user.service';
import { JwtAccessGuard } from '../authn/guards/jwt-access.guard';

@Controller('users')
@UseGuards(JwtAccessGuard, AuthzGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ReqCreateUserSchema))
  create(@Body() body: ReqCreateUserDto) {
    return this.userService.create(body);
  }
}
