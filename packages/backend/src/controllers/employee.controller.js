"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const employee_service_1 = require("../services/employee.service");
const employeeService = new employee_service_1.EmployeeService();
class EmployeeController {
    async create(req, res) {
        try {
            const employee = await employeeService.create(req.body);
            res.status(201).json(employee);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAll(req, res) {
        try {
            const employees = await employeeService.findAll();
            res.json(employees);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async update(req, res) {
        try {
            const employee = await employeeService.update(req.params.id, req.body);
            res.json(employee);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async delete(req, res) {
        try {
            await employeeService.delete(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.EmployeeController = EmployeeController;
//# sourceMappingURL=employee.controller.js.map