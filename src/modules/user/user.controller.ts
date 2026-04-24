import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/validation.pipe';
import { ReqCreateUserDto, ReqCreateUserSchema } from './user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ReqCreateUserSchema))
  create(@Body() body: ReqCreateUserDto) {
    return this.userService.create(body);
  }
}
