import mongoose, { isValidObjectId } from 'mongoose';
import { Subscription } from '../models/subscription.models.js';
import { User } from '../models/users.models.js';
import { ApiError } from '../utilities/ApiError.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import { asyncHandler } from '../utilities/asyncHandler.js';

export const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channelId');
  }

  const UserId = req.user?._id;

  if (!UserId || !isValidObjectId(UserId)) {
    throw new ApiError(400, 'Please login to subscribe');
  }

  if (UserId.toString().trim() === channelId.toString().trim()) {
    throw new ApiError(400, 'You cannot subscribe to yourself');
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: UserId,
    channel: channelId,
  });

  if (!isSubscribed) {
    const subscribed = await Subscription.create({
      subscriber: UserId,
      channel: channelId,
    });

    if (!subscribed) {
      throw new ApiError(500, 'Subscription failed');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Subscribed successfully'));
  } else {
    const unSubscribed = await Subscription.deleteOne({
      subscriber: UserId,
      channel: channelId,
    });

    if (!unSubscribed) {
      throw new ApiError(500, 'Failed to unsubscribe');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Unsubscribed successfully'));
  }
});

export const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId) || !channelId) {
    throw new ApiError(400, 'Invalid channelId');
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'subscriber',
        foreignField: '_id',
        as: 'subscribers',
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
              avatar: 1,
              banner: 1,
              watchHistory: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        subscribers: 1,
      },
    },
  ]);

  if (subscribers.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], 'No subscribers found'));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, 'Subscribers found'));
});

export const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId) || !subscriberId) {
    throw new ApiError(400, 'Invalid subscriberId');
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'channel',
        foreignField: '_id',
        as: 'subscribedChannels',
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
              avatar: 1,
              banner: 1,
              watchHistory: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        subscribedChannels: 1,
      },
    },
  ]);

  if (subscribedChannels.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], 'No subscribed channels found'));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribedChannels, 'Subscribed channels found')
    );
});
