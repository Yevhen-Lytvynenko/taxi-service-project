import { Request, Response } from 'express';
export declare class OrderController {
    /** Оціночна вартість по всіх тарифах (координати або текстові адреси). */
    quote(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /** Ручне замовлення з панелі (телефон клієнта). */
    dispatchCreate(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAll(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getOne(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    selectRoute(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    simulate(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=order.controller.d.ts.map