import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateCartDto {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({ example: '1' })
  quantity: number;
}
