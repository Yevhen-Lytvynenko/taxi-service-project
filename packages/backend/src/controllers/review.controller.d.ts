import { Request, Response } from 'express';
export declare class ReviewController {
    getAll(req: Request, res: Response): Promise<void>;
    /** Відгуки про поточного користувача (профіль). */
    getAboutMe(req: Request, res: Response): Promise<void>;
    /** Публічні відгуки про користувача за id (для перегляду контрагента). */
    getByUserId(req: Request, res: Response): Promise<void>;
    createAuthenticated(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getByDriver(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=review.controller.d.ts.map