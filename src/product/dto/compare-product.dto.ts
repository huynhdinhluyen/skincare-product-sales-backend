import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class CompareProductsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  productIds: string[];
}
