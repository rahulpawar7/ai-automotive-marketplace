import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { optionalAuth } from '../middleware/auth';
import { ChatBodySchema, chatHandler } from '../controllers/chatController';

const router = Router();

// Auth is optional — the assignment does not require it, but if a token is
// present we attach the user so server-side per-user features can be added later.
router.post('/', optionalAuth, validate(ChatBodySchema, 'body'), asyncHandler(chatHandler));

export default router;
