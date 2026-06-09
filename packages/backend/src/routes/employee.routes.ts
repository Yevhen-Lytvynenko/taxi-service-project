import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { requireOfficeStaff } from '../middleware/authorize.middleware';

const router = Router();
const employeeController = new EmployeeController();

router.use(authMiddleware);

router.post('/', roleMiddleware(['ADMIN']), employeeController.create.bind(employeeController));
router.get('/', requireOfficeStaff, employeeController.getAll.bind(employeeController));
router.put('/:id', roleMiddleware(['ADMIN']), employeeController.update.bind(employeeController));
router.delete('/:id', roleMiddleware(['ADMIN']), employeeController.delete.bind(employeeController));

export default router;
