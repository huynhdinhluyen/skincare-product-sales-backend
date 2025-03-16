import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from '../user/dto/signup.dto';
import { UserDetails } from '../user/user-details.interface';
import { UserService } from '../user/user.service';
import { LoginDto } from 'src/user/dto/login.dto';
import { UpdateUserDto } from 'src/user/dto/update-profile.dto';
import { User, UserDocument } from './schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChangePasswordDto } from 'src/user/dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
      address: user.address,
      city: user.city,
      role: user.role,
    };

    const jwt = await this.jwtService.sign(payload);
    return { token: jwt };
  }

  async updateProfile(
    userId: string,
    updateData: UpdateUserDto,
  ): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<User> {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    if (oldPassword === newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu cũ');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedNewPassword;
    return user.save();
  }
}
