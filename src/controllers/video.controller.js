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
        $and: [
          {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
            ],

            isPublished: true,
          },
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
    res.status(404).json(new ApiResponse(404, 'No videos found'));
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

  // console.log(videoFile, thumbnailFile);

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

    return res
      .status(201)
      .json(new ApiResponse(201, video, 'Video published successfully'));
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

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
        isPublished: true,
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
  ]);

  // console.log(video);

  if (!video.length) {
    res.status(404).json(new ApiResponse(404, 'Video not found'));
  }

  return res.status(200).json(new ApiResponse(200, video[0]));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  const userId = req.user?._id;
  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'You are not authorized please login first!!');
  }

  const { title, description } = req.body;
  const thumbnail = req.file?.path;

  // console.log(title, description, thumbnail);

  if ([title, description, thumbnail].every((value) => !value)) {
    throw new ApiError(400, 'Please provide title, description or thumbnail');
  }

  let thumbnailFile;
  if (thumbnail) {
    try {
      thumbnailFile = await cloudinaryUpload(thumbnail);
    } catch (error) {
      throw new ApiError(500, 'Failed to upload thumbnail');
    }
  }

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, 'Video not found');
    }

    if (video.owner.toString() !== user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to update this video!!');
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      video._id,
      {
        $set: {
          title: title || video.title,
          description: description || video.description,
          thumbnail: thumbnailFile?.url || video.thumbnail,
        },
      },
      {
        new: true,
      }
    );

    // console.log(updatedVideo);

    if (!updatedVideo) {
      throw new ApiError(500, 'Failed to update video');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, 'Video updated successfully'));
  } catch (error) {
    if (thumbnailFile) {
      await cloudinaryDelete(thumbnailFile.public_id);
    }

    // console.log(error);

    throw new ApiError(500, 'FUCK: Failed to update video');
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, 'Invalid Video Id');
  }

  const UserId = req.user?.id;

  if (!UserId) {
    throw new ApiError(400, 'Your are not authorized, please login first!!');
  }

  const user = await User.findById(UserId);

  if (!user) {
    throw new ApiError(
      400,
      'You are not authorized to toggle the publish status of this video'
    );
  }

  const PublishedStatus = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $project: {
        _id: 0,
        isPublished: 1,
      },
    },
  ]);

  const publishedStatus = PublishedStatus[0].isPublished ? false : true;

  const videoAfterToggled = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: publishedStatus,
      },
    },
    {
      new: true,
    }
  ).select('isPublished');

  if (!videoAfterToggled) {
    throw new ApiError(500, 'Failed to toggle the publish status');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        400,
        videoAfterToggled,
        'Successfully toggled the publish status'
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  togglePublishStatus,
};
