import { Request, Response } from 'express';
export declare class AnalyticsController {
    summary(req: Request, res: Response): Promise<void>;
    peaks(req: Request, res: Response): Promise<void>;
    routes(req: Request, res: Response): Promise<void>;
    traffic(req: Request, res: Response): Promise<void>;
    finance(req: Request, res: Response): Promise<void>;
    demandSeries(req: Request, res: Response): Promise<void>;
    peaksDetected(req: Request, res: Response): Promise<void>;
    forecast(req: Request, res: Response): Promise<void>;
    surge(req: Request, res: Response): Promise<void>;
    pickupGrid(req: Request, res: Response): Promise<void>;
    driverKpis(req: Request, res: Response): Promise<void>;
    financeDaily(req: Request, res: Response): Promise<void>;
    exportOrders(req: Request, res: Response): Promise<void>;
    createMaintenance(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    listMaintenance(req: Request, res: Response): Promise<void>;
    createPayroll(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createOperatingExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=analytics.controller.d.ts.map