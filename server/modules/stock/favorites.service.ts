import { Injectable, ConflictException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, sql } from 'drizzle-orm';
import { stockFavorites } from '@server/database/schema';
import type { FavoriteItem } from '@shared/api.interface';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async list(userId: string): Promise<FavoriteItem[]> {
    const rows = await this.db
      .select({
        id: stockFavorites.id,
        stockCode: stockFavorites.stockCode,
        stockName: stockFavorites.stockName,
        createdAt: stockFavorites.createdAt,
      })
      .from(stockFavorites)
      .where(eq(stockFavorites.userId, sql`${userId}::uuid`))
      .orderBy(stockFavorites.createdAt);

    return rows.map((row) => ({
      id: row.id,
      stockCode: row.stockCode,
      stockName: row.stockName,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async add(
    userId: string,
    stockCode: string,
    stockName: string,
  ): Promise<FavoriteItem> {
    const existing = await this.db
      .select({ id: stockFavorites.id })
      .from(stockFavorites)
      .where(
        and(
          eq(stockFavorites.userId, sql`${userId}::uuid`),
          eq(stockFavorites.stockCode, stockCode),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('该股票已在自选列表中');
    }

    const [result] = await this.db
      .insert(stockFavorites)
      .values({
        userId: sql`${userId}::uuid`,
        stockCode,
        stockName,
      })
      .returning({
        id: stockFavorites.id,
        stockCode: stockFavorites.stockCode,
        stockName: stockFavorites.stockName,
        createdAt: stockFavorites.createdAt,
      });

    return {
      id: result.id,
      stockCode: result.stockCode,
      stockName: result.stockName,
      createdAt: result.createdAt.toISOString(),
    };
  }

  async remove(userId: string, stockCode: string): Promise<void> {
    const deleted = await this.db
      .delete(stockFavorites)
      .where(
        and(
          eq(stockFavorites.userId, sql`${userId}::uuid`),
          eq(stockFavorites.stockCode, stockCode),
        ),
      )
      .returning({ id: stockFavorites.id });

    if (deleted.length === 0) {
      return;
    }
  }

  async check(userId: string, stockCode: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: stockFavorites.id })
      .from(stockFavorites)
      .where(
        and(
          eq(stockFavorites.userId, sql`${userId}::uuid`),
          eq(stockFavorites.stockCode, stockCode),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }
}
