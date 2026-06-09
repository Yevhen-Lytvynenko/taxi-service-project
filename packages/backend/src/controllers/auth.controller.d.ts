import { Request, Response } from 'express';
export declare class AuthController {
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    register(req: Request, res: Response): Promise<void>;
    registerDriver(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getMe(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updatePushToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=auth.controller.d.ts.map