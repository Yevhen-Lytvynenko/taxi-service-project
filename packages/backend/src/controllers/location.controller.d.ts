import { Request, Response } from 'express';
export declare class LocationController {
    listRecent(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getHeatmap(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=location.controller.d.ts.map