import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';

const router = Router();
const employeeController = new EmployeeController();

router.post('/', employeeController.create.bind(employeeController));
router.get('/', employeeController.getAll.bind(employeeController));
router.put('/:id', employeeController.update.bind(employeeController));
router.delete('/:id', employeeController.delete.bind(employeeController));

export default router;