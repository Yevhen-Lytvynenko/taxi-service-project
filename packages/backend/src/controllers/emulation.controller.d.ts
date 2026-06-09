import { Request, Response } from 'express';
export declare function bootstrap(_req: Request, res: Response): Promise<void>;
export declare function createAndAssignOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function setOrderSimulationStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function setDriverOnlineLocation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=emulation.controller.d.ts.map