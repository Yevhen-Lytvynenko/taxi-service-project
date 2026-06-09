import 'dotenv/config';
import './types/express-augmentation';
import http from 'http';
import { Server } from 'socket.io';
import { SocketService } from './services/socket.service';
export declare function createApp(): Promise<{
    app: import("express-serve-static-core").Express;
    httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    socketService: SocketService;
}>;
//# sourceMappingURL=createApp.d.ts.map