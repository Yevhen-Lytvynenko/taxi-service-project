import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';

const transactionService = new TransactionService();

export class TransactionController {
  async create(req: Request, res: Response) {
    try {
      const transaction = await transactionService.create(req.body);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const transactions = await transactionService.findAll();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByDriver(req: Request, res: Response) {
    try {
      const transactions = await transactionService.findByDriverId(req.params.driverId as string);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const transaction = await transactionService.findById(req.params.id as string);
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}