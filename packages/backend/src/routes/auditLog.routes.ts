import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOfficePermission } from '../middleware/permissions.middleware';

const router = Router();
const c = new AuditLogController();

router.use(authMiddleware, requireOfficePermission('audit', 'read'));
router.get('/', c.list.bind(c));

export default router;
