import { Router } from 'express';
import { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos } from '../controllers/like.controller.js';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/video/:videoId').post(jwtVerifyToken, toggleVideoLike);
router.route('/comment/:commentId').post(jwtVerifyToken, toggleCommentLike);
router.route('/tweet/:tweetId').post(jwtVerifyToken, toggleTweetLike);
router.route('/videos').get(jwtVerifyToken, getLikedVideos);

export default router;
