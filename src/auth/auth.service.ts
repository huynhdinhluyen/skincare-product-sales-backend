import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from '../user/dto/signup.dto';
import * as bcrypt from 'bcryptjs';
import { UserDetails } from '../user/user-details.interface';
import { UserService } from '../user/user.service';
import { LoginDto } from 'src/user/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async signUp(
    userSignup: Readonly<SignupDto>,
  ): Promise<UserDetails | null | string> {
    const {
      username,
      email,
      password,
      fullName,
      phone,
      city,
      address,
      point,
      role,
    } = userSignup;

    const existingUserByEmail = await this.userService.findByEmail(email);
    const existingUserByUsername =
      await this.userService.findByUsername(username);
    const existingPhone = await this.userService.checkDuplicatePhone(phone);

    if (existingUserByEmail) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    if (existingUserByUsername) {
      throw new HttpException(
        'Username already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (existingPhone) {
      throw new HttpException('Phone already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await this.hashPassword(password);
    const newUser = await this.userService.create(
      username,
      email,
      hashedPassword,
      fullName,
      phone,
      city,
      address,
      point,
      role,
    );

    return this.userService.getUserDetails(newUser);
  }

  async doesPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDetails | null> {
    const user = await this.userService.findByEmail(email);
    const doesUserExist = !!user;

    const doesPasswordMatch = await this.doesPasswordMatch(
      password,
      user?.password ? user.password : '',
    );

    if (!doesUserExist || !doesPasswordMatch) {
      throw new HttpException(
        'Email or Password is not correct',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.userService.getUserDetails(user);
  }

  async login(
    userLogin: Readonly<LoginDto>,
  ): Promise<{ token: string } | null> {
    const { email, password } = userLogin;
    const user = await this.validateUser(email, password);

    if (!user) return null;

    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    };

    const jwt = await this.jwtService.sign(payload);
    return { token: jwt };
  }
}
