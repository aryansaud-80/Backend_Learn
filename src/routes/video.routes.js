import { Router } from 'express';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';
import {
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
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

router.route('/:videoId').get(getVideoById);

router
  .route('/updateVideo/:videoId')
  .patch(upload.single('thumbnail'), jwtVerifyToken, updateVideo);

router
  .route('/togglePublishStatus/:videoId')
  .patch(jwtVerifyToken, togglePublishStatus);

export default router;
