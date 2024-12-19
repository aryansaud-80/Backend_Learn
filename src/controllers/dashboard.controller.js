import mongoose from 'mongoose';
import { Video } from '../models/vedio.models.js';
import { Subscription } from '../models/subscription.models.js';
import { Like } from '../models/likes.models.js';
import { ApiError } from '../utilities/ApiError.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import { asyncHandler } from '../utilities/asyncHandler.js';


// FIXME: Need to solve the issue with the like controller

export const getChannelStats = asyncHandler(async (req, res) => {

  if (!req.user) {
    throw new ApiError(401, 'You are not authorized to access this route');
  }

  const userId =  new mongoose.Types.ObjectId(req.user?._id);

  const VedioDetail = await Video.aggregate([
    {
      $match: {
        owner: userId,
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$views' },
        totalVideo: {$sum: 1}
      },
    },
    {
      $project:{
        _id: 0,
        totalViews: 1,
        totalVideo: 1
      }
    }
  ]);

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: userId,
      },
    },
    {
      $group: {
        _id: null,
        subscriber: { $sum: 1 },
      },
    },
    {
      $project:{
        _id: 0,
        subscriber: 1
      }
    }
  ]);

  const videoLikes = await Like.aggregate(
    [
      {
        $match: {
          video: {
            $exists: true,
          },
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video",
          pipeline: [
            {
              $project: {
                _id: 0,
                likes: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$video",
        },
      },
      {
        $project: {
          video: 1,
        },
      },
    ]
)

  const info= {
    TotalViews: VedioDetail[0]?.totalViews || 0,
    TotalVideo: VedioDetail[0]?.totalVideo ||0,
    TotalSubscribers: totalSubscribers[0]?.subscriber || 0,
    TotalLikes: videoLikes[0]?.video.likes|| 0
  }

  return res.status(200).json(new ApiResponse(200, info, "Successfully get the channel stats"))
});

export const getChannelVideos = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'You are not authorized to access this route');
  }

  const allVideos = await Video.find({
    owner: new mongoose.Types.ObjectId(req.user._id),
  });

  // if (!allVideos.length) {
  //   throw new ApiError(404, 'No videos found');
  // }

  return res
    .status(200)
    .json(
      new ApiResponse(200, allVideos, 'Get all videos uploaded by the channel')
    );
});
