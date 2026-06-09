import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { ContactsController } from '../controllers/contacts.controller';

const router = Router();
const c = new ContactsController();

router.use(authMiddleware);
router.get('/', c.list.bind(c));
router.post('/', c.add.bind(c));
router.delete('/:peerId', c.remove.bind(c));

export default router;
