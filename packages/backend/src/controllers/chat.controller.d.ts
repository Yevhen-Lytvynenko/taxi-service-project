import { Request, Response } from 'express';
export declare class ChatController {
    listForStaff(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getByOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /** POST body: { "text": "..." } — повідомлення зберігаються в Chat.history як Json-масив. */
    postMessageByOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    addMessage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=chat.controller.d.ts.map