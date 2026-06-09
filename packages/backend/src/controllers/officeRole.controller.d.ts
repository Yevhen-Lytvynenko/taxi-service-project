import { Request, Response } from 'express';
export declare class OfficeRoleController {
    list(_req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    patch(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    remove(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=officeRole.controller.d.ts.map