import { Body, Controller, Post } from '@nestjs/common';
import { SignupDto } from 'src/user/dto/signup.dto';
import { UserDetails } from 'src/user/user-details.interface';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/user/dto/login.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  register(@Body() user: SignupDto): Promise<UserDetails | null | string> {
    return this.authService.signUp(user);
  }

  @Post('login')
  login(@Body() user: LoginDto): Promise<{ token: string }> {
    return this.authService.login(user);
  }
}
