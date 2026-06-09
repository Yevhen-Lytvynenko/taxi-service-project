import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';

const reviewService = new ReviewService();

export class ReviewController {
  async getAll(req: Request, res: Response) {
    try {
      const reviews = await reviewService.findAll();
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /** Відгуки про поточного користувача (профіль). */
  async getAboutMe(req: Request, res: Response) {
    try {
      const reviews = await reviewService.findBySubjectUserId(req.user!.id);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /** Публічні відгуки про користувача за id (для перегляду контрагента). */
  async getByUserId(req: Request, res: Response) {
    try {
      const reviews = await reviewService.findBySubjectUserId(req.params.userId as string);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createAuthenticated(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { orderId, rating, comment } = req.body as {
        orderId?: string;
        rating?: number;
        comment?: string | null;
      };
      if (!orderId) return res.status(400).json({ error: 'orderId is required' });
      const r = Number(rating);
      if (!Number.isFinite(r)) return res.status(400).json({ error: 'rating is required' });

      if (user.role === 'CLIENT') {
        const review = await reviewService.createClientReview(user.id, orderId, r, comment);
        return res.status(201).json(review);
      }
      if (user.role === 'DRIVER' && user.driverId) {
        const review = await reviewService.createDriverReview(
          user.id,
          user.driverId,
          orderId,
          r,
          comment
        );
        return res.status(201).json(review);
      }
      return res.status(403).json({ error: 'Only clients and drivers can leave trip reviews' });
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
