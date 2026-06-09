import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { requireOperationsStaff } from '../middleware/authorize.middleware';

const router = Router();
const reviewController = new ReviewController();

router.use(authMiddleware);

router.get('/', requireOperationsStaff, reviewController.getAll.bind(reviewController));
router.get('/about-me', reviewController.getAboutMe.bind(reviewController));
router.get('/user/:userId', reviewController.getByUserId.bind(reviewController));
router.post('/', reviewController.createAuthenticated.bind(reviewController));
router.get('/driver/:driverId', reviewController.getByDriver.bind(reviewController));
router.delete('/:id', roleMiddleware(['ADMIN', 'MANAGER']), reviewController.delete.bind(reviewController));

export default router;
