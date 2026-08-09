import { type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import type { FavoriteItem } from '@shared/api.interface';
export declare class FavoritesService {
    private readonly db;
    constructor(db: PostgresJsDatabase);
    list(userId: string): Promise<FavoriteItem[]>;
    add(userId: string, stockCode: string, stockName: string): Promise<FavoriteItem>;
    remove(userId: string, stockCode: string): Promise<void>;
    check(userId: string, stockCode: string): Promise<boolean>;
}
