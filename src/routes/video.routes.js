import { Router } from 'express';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';
import {
  getAllVideos,
  publishAVideo,
} from '../controllers/video.controller.js';
import { upload } from '../middlewares/multer.middlewares.js';

const router = Router();

router.route('/').get(getAllVideos);

router.route('/publish').post(
  jwtVerifyToken,
  upload.fields([
    {
      name: 'video',
      maxCount: 1,
    },
    {
      name: 'thumbnail',
      maxCount: 1,
    },
  ]),
  publishAVideo
);

export default router;
