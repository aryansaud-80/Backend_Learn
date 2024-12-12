import { Router } from 'express';
import { toggleVedioLike } from '../controllers/like.controller.js';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/video/:videoId').get(jwtVerifyToken, toggleVedioLike);

export default router;
