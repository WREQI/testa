import { Module, forwardRef } from '@nestjs/common';
import { StockController } from './stock.controller';
import { MarketController } from './market.controller';
import { FavoritesController } from './favorites.controller';
import { StockService } from './stock.service';
import { StockCacheService } from './stock-cache.service';
import { StockSdkDataService } from './stock-sdk-data.service';
import { GridSimulationService } from './grid-simulation.service';
import { FavoritesService } from './favorites.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [StockController, MarketController, FavoritesController],
  providers: [StockService, StockCacheService, StockSdkDataService, GridSimulationService, FavoritesService],
})
export class StockModule {}
