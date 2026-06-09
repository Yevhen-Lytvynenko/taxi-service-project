import { Request, Response } from 'express';
export declare class ContactsController {
    list(req: Request, res: Response): Promise<void>;
    add(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    remove(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=contacts.controller.d.ts.map