import { Body, Controller, Post } from '@nestjs/common';
import { SkinTestResultService } from './skin-test-result.service';
import { ApiTags } from '@nestjs/swagger';
import { SaveSkinTestResultDto } from './dto/skin-type-result.dto';

@ApiTags('Skin Test Result')
@Controller('skin-test-result')
export class SkinTestResultController {
  constructor(private readonly skinTestResultService: SkinTestResultService) {}

  @Post()
  async saveResult(
    @Body()
    saveSkinTestResultDto: SaveSkinTestResultDto,
  ) {
    return await this.skinTestResultService.calculateSkinType(
      saveSkinTestResultDto,
    );
  }
}
