import { Request, Response } from 'express';
export declare class GeocodeController {
    geocode(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    reverseGeocode(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=geocode.controller.d.ts.map