import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from '../models/likes.models.js';
import { Video } from '../models/vedio.models.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import { ApiError } from '../utilities/ApiError.js';
import { asyncHandler } from '../utilities/asyncHandler.js';

//FIXME: Need to solve the issue with the like controller

export const toggleVideoLike = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  try {
    const alreadyLiked = await Like.findOne({
      video: videoId,
      likedBy: userId,
    });

    console.log(alreadyLiked);

    if (alreadyLiked) {
      const isUnLiked = await Like.deleteOne({
        video: videoId,
        likedBy: userId,
      });

      if (isUnLiked) {
        await Video.updateOne({ _id: videoId }, { $inc: { likes: -1 } });
      }

      return res
        .status(200)
        .json(new ApiResponse(200, isUnLiked, 'Like removed'));
    }

    const newLike = await Like.create({ video: videoId, likedBy: userId });

    if (newLike) {
      await Video.updateOne({ _id: videoId }, { $inc: { likes: 1 } });
    }

    return res.status(200).json(new ApiResponse(200, newLike, 'Like added'));
  } catch (error) {
    console.error(error);  // Optional: Better logging for error tracking
    throw new ApiError(500, 'Internal server error');
  }
});

export const toggleCommentLike = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment ID');
  }

  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  try {
    const alreadyLiked = await Like.findOne({
      comment: commentId,
      likedBy: userId,
    });

    if (alreadyLiked) {
      await Like.findByIdAndDelete(alreadyLiked._id);
      return res
        .status(200)
        .json(new ApiResponse(200, alreadyLiked, 'Like removed'));
    }

    const newLike = await Like.create({ comment: commentId, likedBy: userId });
    return res.status(200).json(new ApiResponse(200, newLike, 'Like added'));
  } catch (error) {
    throw new ApiError(500, 'Internal server error');
  }
});

export const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet ID');
  }

  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  try {
    const alreadyLiked = await Like.findOne({
      tweet: tweetId,
      likedBy: userId,
    });
    if (alreadyLiked) {
      await Like.findByIdAndDelete(alreadyLiked._id);
      return res
        .status(200)
        .json(new ApiResponse(200, alreadyLiked, 'Like removed'));
    }

    const newLike = await Like.create({ tweet: tweetId, likedBy: userId });

    return res.status(200).json(new ApiResponse(200, newLike, 'Like added'));
  } catch (error) {
    throw new ApiError(500, 'Internal server error');
  }
});

export const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $ne: null },
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'video',
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              thumbnail: 1,
              views: 1,
              duration: 1,
              isPublished: 1,
              owner: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$video',
    },
    {
      $project: {
        _id: 1,
        video: 1,
      },
    },
  ]);

  if (!likedVideos.length) {
    return res.status(200).json(new ApiResponse(200, [], 'No liked videos'));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, 'Liked videos'));
});
