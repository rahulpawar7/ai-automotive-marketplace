import { Router } from 'express';
import carRoutes from './carRoutes';
import chatRoutes from './chatRoutes';
import authRoutes from './authRoutes';
import { vectorStore } from '../rag/vectorStore';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    vectorIndexLoaded: vectorStore.isReady(),
    vectorIndexSize: vectorStore.size(),
  });
});

router.use('/cars', carRoutes);
router.use('/chat', chatRoutes);
router.use('/auth', authRoutes);

export default router;
