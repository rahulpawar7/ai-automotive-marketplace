import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  LoginSchema,
  RegisterSchema,
  loginHandler,
  meHandler,
  registerHandler,
} from '../controllers/authController';

const router = Router();

router.post('/register', validate(RegisterSchema, 'body'), asyncHandler(registerHandler));
router.post('/login', validate(LoginSchema, 'body'), asyncHandler(loginHandler));
router.get('/me', requireAuth, asyncHandler(meHandler));

export default router;
