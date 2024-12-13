import mongoose, { isValidObjectId } from 'mongoose';
import { asyncHandler } from '../utilities/asyncHandler.js';
import { Comment } from '../models/comments.models.js';
import { ApiError } from '../utilities/ApiError.js';
import { ApiResponse } from '../utilities/ApiResponse.js';

export const getVideoComments = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id');
  }

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'author',
      },
    },
    {
      $unwind: '$author',
    },
    {
      $project: {
        _id: 1,
        content: 1,
        createdAt: 1,
        'author._id': 1,
        'author.username': 1,
        'author.avatar': 1,
      },
    }
  ]);

  return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});
