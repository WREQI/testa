import { FavoritesService } from './favorites.service';
import type { FavoriteItem, AddFavoriteRequest } from '@shared/api.interface';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    list(req: any): Promise<FavoriteItem[]>;
    add(req: any, body: AddFavoriteRequest): Promise<FavoriteItem>;
    remove(req: any, code: string): Promise<{
        success: boolean;
    }>;
    check(req: any, code: string): Promise<{
        isFavorite: boolean;
    }>;
}
