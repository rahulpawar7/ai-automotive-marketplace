import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import {
  getCarHandler,
  getFacetsHandler,
  listCarsHandler,
  ListCarsQuery,
} from '../controllers/carController';

const router = Router();

router.get('/facets', asyncHandler(getFacetsHandler));
router.get('/', validate(ListCarsQuery, 'query'), asyncHandler(listCarsHandler));
router.get('/:carId', asyncHandler(getCarHandler));

export default router;
