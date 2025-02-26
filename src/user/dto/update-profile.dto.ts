import {
  IsOptional,
  IsString,
  IsPhoneNumber,
} from 'class-validator';

export class UpdateUserDto {

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;

}
