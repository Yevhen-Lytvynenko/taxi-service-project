import { Request, Response } from 'express';
export declare class TransactionController {
    create(req: Request, res: Response): Promise<void>;
    getAll(req: Request, res: Response): Promise<void>;
    getByDriver(req: Request, res: Response): Promise<void>;
    getOne(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=transaction.controller.d.ts.map