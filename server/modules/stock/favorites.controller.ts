import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { FavoriteItem, AddFavoriteRequest } from '@shared/api.interface';

@Controller('api/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async list(@Req() req: any): Promise<FavoriteItem[]> {
    return this.favoritesService.list(req.userId);
  }

  @Post()
  async add(
    @Req() req: any,
    @Body() body: AddFavoriteRequest,
  ): Promise<FavoriteItem> {
    if (!body.stockCode || !body.stockName) {
      throw new BadRequestException('股票代码和名称不能为空');
    }
    return this.favoritesService.add(
      req.userId,
      body.stockCode,
      body.stockName,
    );
  }

  @Delete(':code')
  async remove(
    @Req() req: any,
    @Param('code') code: string,
  ): Promise<{ success: boolean }> {
    if (!code) {
      throw new BadRequestException('股票代码不能为空');
    }
    await this.favoritesService.remove(req.userId, code);
    return { success: true };
  }

  @Get('check/:code')
  async check(
    @Req() req: any,
    @Param('code') code: string,
  ): Promise<{ isFavorite: boolean }> {
    const isFavorite = await this.favoritesService.check(req.userId, code);
    return { isFavorite };
  }
}
