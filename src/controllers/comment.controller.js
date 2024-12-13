import mongoose, { isValidObjectId } from 'mongoose';
import { asyncHandler } from '../utilities/asyncHandler.js';
import { Comment } from '../models/comments.models.js';
import { ApiError } from '../utilities/ApiError.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import { Video } from '../models/vedio.models.js';

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
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, 'Comments fetched successfully'));
});

export const addComment = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id');
  }

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Need the content to add a comment');
  }

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const comment = await Comment.create({
    content: content.trim(),
    owner: userId,
    video: videoId,
  });

  if (!comment) {
    throw new ApiError(500, 'Failed to add comment');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, 'Comment added successfully'));
});

export const updateComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const { updatedContent } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment Id');
  }

  if (!updatedContent || updatedContent.trim() === '') {
    throw new ApiError(400, 'No updated content is given');
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, 'No comment found');
  }

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, 'Unauthorized to update the comment');
  }

  if (comment.owner.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to update this comment');
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: updatedContent.trim(),
      },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(400, 'Error to update comment');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, 'Comment updated successfully'));
});

export const deleteComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment Id');
  }

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, 'Unauthorized! You need to login first??');
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, 'No comment found with given comment id');
  }

  const videoId = comment.video;

  if (!videoId) {
    throw new ApiError(400, 'No associated video is found for this comment');
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, 'No video is found');
  }

  if (
    comment.owner.toString() !== userId &&
    video.owner.toString() !== userId
  ) {
    throw new ApiError(400, 'You are not authorized to delete this comment');
  }

  await Comment.findByIdAndDelete(commentId);

  return res.status(200).json(200, {}, 'comment deleted successfully');
});
