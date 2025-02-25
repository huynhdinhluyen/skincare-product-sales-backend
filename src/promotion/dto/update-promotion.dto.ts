import { CreatePromotionDto } from './create-promotion.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {}
