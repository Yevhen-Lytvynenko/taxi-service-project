/**
 * Extends Express Request so `req.user` is typed. Loaded from server/createApp entrypoints
 * so ts-node always applies this merge (global Express namespace merge is flaky with ts-node).
 */
import 'express';
import type { JwtUserPayload } from './jwt-user';
declare module 'express-serve-static-core' {
    interface Request {
        user?: JwtUserPayload;
    }
}
//# sourceMappingURL=express-augmentation.d.ts.map