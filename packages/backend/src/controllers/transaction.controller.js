"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const transaction_service_1 = require("../services/transaction.service");
const transactionService = new transaction_service_1.TransactionService();
class TransactionController {
    async create(req, res) {
        try {
            const transaction = await transactionService.create(req.body);
            res.status(201).json(transaction);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAll(req, res) {
        try {
            const transactions = await transactionService.findAll();
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getByDriver(req, res) {
        try {
            const transactions = await transactionService.findByDriverId(req.params.driverId);
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getOne(req, res) {
        try {
            const transaction = await transactionService.findById(req.params.id);
            if (!transaction)
                return res.status(404).json({ error: 'Transaction not found' });
            res.json(transaction);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=transaction.controller.js.map