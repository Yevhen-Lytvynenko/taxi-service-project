import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';

const reviewService = new ReviewService();

export class ReviewController {
  async create(req: Request, res: Response) {
    try {
      const review = await reviewService.create(req.body);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByDriver(req: Request, res: Response) {
    try {
      const reviews = await reviewService.findByDriverId(req.params.driverId as string);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await reviewService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}