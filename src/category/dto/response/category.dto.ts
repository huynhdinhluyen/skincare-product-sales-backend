import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({
    description: 'Category ID',
    example: '6789e2691cb3650e833ec269',
  })
  _id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Face Creams',
  })
  name: string;
}
