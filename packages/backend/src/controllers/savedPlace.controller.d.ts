import { Request, Response } from 'express';
export declare class SavedPlaceController {
    listMine(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createMine(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateMine(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteMine(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=savedPlace.controller.d.ts.map