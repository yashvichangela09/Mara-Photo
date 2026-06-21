import { Router } from 'express';
import authRoutes from './authRoutes';
import studioRoutes from './studioRoutes';
import eventRoutes from './eventRoutes';
import mediaRoutes from './mediaRoutes';
import aiRoutes from './aiRoutes';
import paymentRoutes from './paymentRoutes';
import supportRoutes from './supportRoutes';
import analyticsRoutes from './analyticsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/studio', studioRoutes);
router.use('/event', eventRoutes);
router.use('/media', mediaRoutes);
router.use('/ai', aiRoutes);
router.use('/payment', paymentRoutes);
router.use('/support', supportRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
