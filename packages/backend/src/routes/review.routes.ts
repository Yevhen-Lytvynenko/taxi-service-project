import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';

const router = Router();
const reviewController = new ReviewController();

router.post('/', reviewController.create.bind(reviewController));
router.get('/driver/:driverId', reviewController.getByDriver.bind(reviewController));
router.delete('/:id', reviewController.delete.bind(reviewController));

export default router;