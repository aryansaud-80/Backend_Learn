import { Router } from 'express';

import {
  getChannelStats,
  getChannelVideos,
} from '../controllers/dashboard.controller.js';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/').get(jwtVerifyToken, getChannelStats);
router.route('/videos').get(jwtVerifyToken, getChannelVideos);

export default router;
