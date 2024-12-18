import { Router } from 'express';
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from '../controllers/tweet.controller.js';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/create-tweet').post(jwtVerifyToken, createTweet);
router.route('/getUserTweets/:userId').get(getUserTweets);
router.route('/update-tweet/:tweetId').put(jwtVerifyToken, updateTweet);
router.route('/delete-tweet/:tweetId').delete(jwtVerifyToken, deleteTweet);

export default router;
