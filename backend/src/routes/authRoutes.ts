import { Router } from 'express';
import { registerStudioOwner, login, googleLogin, requestOTP, verifyOTP, refreshToken } from '../controllers/authController';

const router = Router();

router.post('/register', registerStudioOwner);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/refresh-token', refreshToken);

export default router;
