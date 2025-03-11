import express from 'express';
import upload from '../middleware/multerConfig.js';
import {
    register,
    login,
    verify,
    sendLink
} from '../controllers/authController.js';

const router = express.Router();

 router.post('/register', upload.single('profile_pic'), register);

 router.post('/login', login);
router.get('/verify/:link', verify);
router.post('/send-verification', sendLink);

export default router;
