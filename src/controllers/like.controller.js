import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from '../models/likes.models.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import { ApiError } from '../utilities/ApiError.js';
import { asyncHandler } from '../utilities/asyncHandler.js';

export const toggleVedioLike = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  if (!isValidObjectId(vedioId)) {
    throw new ApiError(400, 'Invalid vedio ID');
  }

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  try {
    const alreadyLiked = await Like.findOne({ video: videoId, user: userId });

    if (alreadyLiked) {
      await Like.findByIdAndDelete(alreadyLiked._id);
      return res
        .status(200)
        .json(new ApiResponse(200, alreadyLiked, 'Like removed'));
    }

    const newLike = await Like.create({ video: videoId, user: userId });

    return res.status(200).json(new ApiResponse(200, newLike, 'Like added'));
  } catch (error) {
    throw new ApiError(500, 'Internal server error');
  }
});
