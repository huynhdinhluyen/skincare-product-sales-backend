import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Role } from 'src/auth/enums/role.enum';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'username' })
  readonly username: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter correct email format' })
  @ApiProperty({ example: 'email' })
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'password' })
  readonly password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'fullName' })
  readonly fullName: string;

  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('VN', { message: 'Please enter correct phone number format' })
  @ApiProperty({ example: 'phone' })
  readonly phone: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'city' })
  readonly city: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'address' })
  readonly address: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly point: number;

  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role' })
  readonly role: string;
}
