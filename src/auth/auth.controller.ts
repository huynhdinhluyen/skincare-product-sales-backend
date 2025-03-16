import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SignupDto } from 'src/user/dto/signup.dto';
import { UserDetails } from 'src/user/user-details.interface';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/user/dto/login.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from 'src/user/dto/update-profile.dto';
import { UserService } from 'src/user/user.service';
import { ChangePasswordDto } from 'src/user/dto/change-password.dto';

@ApiTags('User')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('signup')
  register(@Body() user: SignupDto): Promise<UserDetails | null | string> {
    return this.authService.signUp(user);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates a user and returns a JWT token',
  })
  login(@Body() user: LoginDto): Promise<{ token: string }> {
    return this.authService.login(user);
  }

  @Put(':id/update')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  updateUser(@Param('id') id: string, @Body() updateProduct: UpdateUserDto) {
    return this.userService.updateProfile(id, updateProduct);
  }

  @Put(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    return this.authService.changePassword(id, changePasswordDto);
  }
}
