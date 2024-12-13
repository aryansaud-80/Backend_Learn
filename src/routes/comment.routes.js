import { Router } from 'express';
import { getVideoComments } from '../controllers/comment.controller.js';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/:videoId').get(jwtVerifyToken, getVideoComments);


export default router;