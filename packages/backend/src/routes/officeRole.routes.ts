import { Router } from 'express';
import { OfficeRoleController } from '../controllers/officeRole.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOfficePermission } from '../middleware/permissions.middleware';

const router = Router();
const c = new OfficeRoleController();

router.use(authMiddleware);

router.get('/', requireOfficePermission('roles_manage', 'read'), c.list.bind(c));
router.post('/', requireOfficePermission('roles_manage', 'write'), c.create.bind(c));
router.patch('/:id', requireOfficePermission('roles_manage', 'write'), c.patch.bind(c));
router.delete('/:id', requireOfficePermission('roles_manage', 'write'), c.remove.bind(c));

export default router;
