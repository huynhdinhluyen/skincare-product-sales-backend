import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class OptionDto {
  @IsNotEmpty()
  @ApiProperty({
    example: 'Paris',
    description: 'Option for the question',
  })
  option: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 10,
    description: 'Point assigned to the option',
  })
  point: number;
}
