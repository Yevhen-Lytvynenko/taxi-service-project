import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';

const employeeService = new EmployeeService();

export class EmployeeController {
  async create(req: Request, res: Response) {
    try {
      const employee = await employeeService.create(req.body);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const employees = await employeeService.findAll();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const employee = await employeeService.update(req.params.id as string, req.body);
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await employeeService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}