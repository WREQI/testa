import type { GridSimulateRequest, GridSimulateResult } from '@shared/api.interface';
interface KlineRow {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
}
export declare class GridSimulationService {
    private readonly logger;
    simulate(params: GridSimulateRequest, klines: KlineRow[]): GridSimulateResult;
    private validateParams;
    private calcGeometricGridLines;
    private getGridIndex;
    private calcFee;
    private buildEquityCurve;
    private calcMaxDrawdown;
}
export {};
