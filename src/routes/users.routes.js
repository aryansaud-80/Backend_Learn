import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserProfile,
  updateUserAvatar,
  updateUserBanner,
} from '../controllers/users.controller.js';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';
import { upload } from '../middlewares/multer.middlewares.js';

const router = Router();

router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route('/login').post(loginUser);

router.route('/logout').post(jwtVerifyToken, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(jwtVerifyToken, changePassword);
router.route('/current-user').get(jwtVerifyToken, getCurrentUser);
router.route('/update-profile').patch(jwtVerifyToken, updateUserProfile);
router
  .route('/update-avatar')
  .patch(jwtVerifyToken, upload.single('avatar'), updateUserAvatar);
router
  .route('/update-cover-image')
  .patch(jwtVerifyToken, upload.single('banner'), updateUserBanner);
  //?if upload.single('name') is used the name should be equal to the name in the formdata

export default router;
