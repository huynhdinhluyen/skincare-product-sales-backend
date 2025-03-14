import { PartialType } from '@nestjs/swagger';
import { CreateSkinCarePlanDto } from './create-skin-care-plan.dto';

export class UpdateSkinCarePlanDto extends PartialType(CreateSkinCarePlanDto) {}
