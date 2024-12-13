import { Router } from 'express';
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/:videoId').get(jwtVerifyToken, getVideoComments);
router.route('/addComment/:videoId').post(jwtVerifyToken, addComment);
router.route('/updateComment/:commentId').patch(jwtVerifyToken, updateComment);
router.route('/deleteComment/:commentId').delete(jwtVerifyToken, deleteComment);

export default router;
