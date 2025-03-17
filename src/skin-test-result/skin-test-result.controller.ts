import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SkinTestResultService } from './skin-test-result.service';
import { SaveSkinTestResultDto } from './dto/skin-type-result.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Skin Tests')
@Controller('skin-tests')
export class SkinTestResultController {
  constructor(private readonly skinTestResultService: SkinTestResultService) {}

  @Post('submit')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Submit skin test results',
    description: 'Submit user answers to determine skin type',
  })
  @ApiResponse({
    status: 201,
    description: 'Skin type determined successfully',
  })
  async saveSkinTestResult(@Body() dto: SaveSkinTestResultDto) {
    const result = await this.skinTestResultService.saveSkinTestResult(dto);
    return {
      success: true,
      data: {
        skinType: result.skinType,
        score: result.score,
      },
      message: `Your skin type is: ${result.skinType}`,
    };
  }

  @Get('users/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Get user skin type',
    description: 'Retrieves skin type for a specific user',
  })
  @ApiResponse({ status: 200, description: 'Skin type retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Skin type not found' })
  async getUserSkinType(@Param('userId') userId: string) {
    const skinType = await this.skinTestResultService.getUserSkinType(userId);
    return {
      success: true,
      data: { skinType },
      message: 'Skin type retrieved successfully',
    };
  }
}
