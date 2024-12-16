import mongoose, { isValidObjectId } from 'mongoose';
import { Video } from '../models/vedio.models.js';
import { User } from '../models/users.models.js';
import { ApiError } from '../utilities/ApiError.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import { asyncHandler } from '../utilities/asyncHandler.js';
import {
  cloudinaryUpload,
  cloudinaryDelete,
} from '../utilities/cloudinaryUpload.js';

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

  if (!query?.trim()) {
    throw new ApiError(400, 'Please provide a search query');
  }

  const limitValue = parseInt(limit, 10);
  const totalPage = parseInt(page, 10);

  if (isNaN(limitValue) || isNaN(totalPage)) {
    throw new ApiError(400, 'Invalid query params');
  }
  const sortByValue = ['title', 'views', 'likes', 'createdAt'].includes(sortBy)
    ? sortBy
    : 'createdAt';
  const sortTypeValue = sortType === 'asc' ? 1 : -1;

  const videos = await Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
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
              username: 1,
              avatar: 1,
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
        title: 1,
        description: 1,
        views: 1,
        duration: 1,
        likes: 1,
        thumbnail: 1,
        owner: 1,
      },
    },
    {
      $sort: {
        [sortByValue]: sortTypeValue,
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page: totalPage } }],
        videos: [
          { $skip: (totalPage - 1) * limitValue },
          { $limit: limitValue },
        ],
      },
    },
  ]);

  if (!videos[0].videos.length) {
    throw new ApiError(404, 'No videos found');
  }

  return res.status(200).json(new ApiResponse(200, videos[0]));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, 'Please provide title and description');
  }

  const userId = req.user?._id;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const videoFilePath = req.files?.video?.[0]?.path;
  const thumbnailFilePath = req.files?.thumbnail?.[0]?.path;

  if (!videoFilePath || !thumbnailFilePath) {
    throw new ApiError(400, 'Please provide video and thumbnail');
  }

  let videoFile;
  try {
    videoFile = await cloudinaryUpload(videoFilePath);
  } catch (error) {
    throw new ApiError(500, 'Failed to upload video');
  }

  let thumbnailFile;
  try {
    thumbnailFile = await cloudinaryUpload(thumbnailFilePath);
  } catch (error) {
    await cloudinaryDelete(videoFile.public_id);
    throw new ApiError(500, 'Failed to upload thumbnail');
  }

  console.log(videoFile, thumbnailFile);

  try {
    const video = await Video.create({
      vedioFile: videoFile.url,
      thumbnail: thumbnailFile.url,
      title,
      description,
      duration: videoFile.duration,
      likes: 1,
      isPublished: true,
      owner: user._id,
    });

    if (!video) {
      throw new ApiError(500, 'Failed to publish video');
    }

    return res.status(201).json(new ApiResponse(201, video));
  } catch (error) {
    if (videoFile) {
      await cloudinaryDelete(videoFile.public_id);
    }

    if (thumbnailFile) {
      await cloudinaryDelete(thumbnailFile.public_id);
    }

    throw new ApiError(500, 'Failed to publish video');
  }
});

export { getAllVideos, publishAVideo };
