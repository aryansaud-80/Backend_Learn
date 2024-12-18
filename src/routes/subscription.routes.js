import { Router } from 'express';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from '../controllers/subscription.controller.js';

const router = Router();

router
  .route('/toggleSubscribe/:channelId')
  .post(jwtVerifyToken, toggleSubscription);

router
  .route('/getSubscribers/:channelId')
  .get(jwtVerifyToken, getUserChannelSubscribers);

router.route('/getSubscribedChannel/:subscriberId').get(getSubscribedChannels);

export default router;
