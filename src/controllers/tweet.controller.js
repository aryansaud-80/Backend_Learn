import mongoose, { isValidObjectId } from 'mongoose';
import { Tweet } from '../models/tweet.models.js';
import { User } from '../models/users.models.js';
import { ApiError } from '../utilities/ApiError.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import { asyncHandler } from '../utilities/asyncHandler.js';

export const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, 'Content is required');
  }

  const UserId = req.user?._id;

  if (!isValidObjectId(UserId)) {
    throw new ApiError(400, 'Invalid User ID');
  }

  const user = await User.findById(UserId);

  if (!user) {
    throw new ApiError(
      404,
      'User not found! You are not authorized to create a tweet'
    );
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: user._id,
  });

  if (!tweet) {
    throw new ApiError(500, 'Tweet not created');
  }

  return res.status(201).json(new ApiResponse(201, tweet, 'Tweet created'));
});

export const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid User ID');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const userTweet = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [
          {
            $project: {
              password: 0,
              refreshToken: 0,
              __v: 0,
              watchHistory: 0,
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: '$owner',
    },
    {
      $project: {
        _id: 1,
        content: 1,
        owner: 1,
      },
    },
  ]);

  //& console.log(userTweet);

  if (!userTweet.length) {
    throw new ApiError(404, 'User has no tweets');
  }

  return res.status(200).json(new ApiResponse(200, userTweet, 'User tweets'));
});

export const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid Tweet ID');
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found');
  }

  if (!req.user || !req.user._id) {
    throw new ApiError(401, 'You are not authorized to update this tweet');
  }
  if (tweet.owner.toString().trim() !== req.user?._id.toString().trim()) {
    throw new ApiError(403, 'You are not authorized to update this tweet');
  }

  const { newContent } = req.body;

  if (!newContent || newContent.trim() === '') {
    throw new ApiError(400, 'Content is required');
  }

  tweet.content = newContent.trim();

  await tweet.save({ validateBeforeSave: true });

  return res.status(200).json(new ApiResponse(200, tweet, 'Tweet updated'));
});

export const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid Tweet ID');
  }

  if (!req.user || !req.user._id) {
    throw new ApiError(401, 'You are not authorized to delete this tweet');
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found');
  }

  if (tweet.owner.toString().trim() !== req.user?._id.toString().trim()) {
    throw new ApiError(403, 'You are not authorized to delete this tweet');
  }

  const deletedTweet = await Tweet.deleteOne({ _id: tweet?._id });

  if (!deletedTweet) {
    throw new ApiError(500, 'Tweet not deleted');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, 'Tweet deleted'));
});
