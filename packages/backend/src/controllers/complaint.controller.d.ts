import { Request, Response } from 'express';
export declare class ComplaintController {
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    listStaff(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=complaint.controller.d.ts.map