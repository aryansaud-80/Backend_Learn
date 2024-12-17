import mongoose, { isValidObjectId } from 'mongoose';
import { Playlist } from '../models/playlists.models.js';
import { Video } from '../models/vedio.models.js'; 
import { User } from '../models/users.models.js';
import { ApiError } from '../utilities/ApiError.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import { asyncHandler } from '../utilities/asyncHandler.js';

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description || 
      name.trim() === '' || description.trim() === '') {
    throw new ApiError(400, 'Name and description are required');
  }

  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(
      401,
      'You are not authorized to create playlist. Please login first.'
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: user._id,
  });

  if (!playlist) {
    throw new ApiError(500, 'Failed to create playlist');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, 'Successfully created playlist'));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'No user is registered with that ID');
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'videos',
        pipeline: [
          {
            $project: {
              title: 1,
              thumbnail: 1,
              videoFile: 1,
              description: 1,
              views: 1,
              duration: 1,
              likes: 1,
              isPublished: 1,
            },
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
              email: 1,
              avatar: 1,
              banner: 1,
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
        name: 1,
        description: 1,
        owner: 1,
        videos: 1,
        videoCount: { $size: '$videos' },
      },
    },
  ]);

  if (!playlists.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], 'No playlists found for this user'));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, 'User playlists retrieved'));
});

const getPlaylistsById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId.trim() || !isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'videos',
        pipeline: [
          {
            $project: {
              title: 1,
              thumbnail: 1,
              videoFile: 1,
              description: 1,
              views: 1,
              duration: 1,
              likes: 1,
              isPublished: 1,
            },
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
              email: 1,
              avatar: 1,
              banner: 1,
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
        name: 1,
        description: 1,
        owner: 1,
        videos: 1,
        videoCount: { $size: '$videos' },
      },
    },
  ]);

  if (!playlist.length) {
    throw new ApiError(404, 'No playlist found with given ID');
  }

  return res.status(200).json(new ApiResponse(200, playlist[0], 'Playlist found'));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user?.id;

  if (!playlistId.trim() || !videoId.trim()) {
    throw new ApiError(400, 'Playlist ID and Video ID are required');
  }

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid ID format');
  }

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(401, 'Unauthorized to modify playlist');
  }


  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found or you are not the owner');
  }


  if (playlist.videos.includes(videoId)) {
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, 'Video already in playlist'));
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, 'Failed to add video to playlist');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, 'Video added to playlist'));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId.trim() || !videoId.trim()) {
    throw new ApiError(400, 'Playlist ID and Video ID are required');
  }

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid ID format');
  }

  const userId = req.user?.id;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(401, 'Unauthorized to modify playlist');
  }

  const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found or you are not the owner');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, 'Failed to remove video from playlist');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, 'Video removed from playlist'));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId.trim() || !isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }

  const userId = req.user?.id;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(401, 'Unauthorized to delete playlist');
  }

  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: userId,
  });

  if (!deletedPlaylist) {
    throw new ApiError(404, 'Playlist not found or you are not the owner');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedPlaylist, 'Playlist deleted successfully'));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;


  if ([name, description].every(field => field === undefined)) {
    throw new ApiError(400, 'At least one field to update is required');
  }


  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }

  const userId = req.user?.id;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(401, 'Unauthorized');
  }

  const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId },
    {
      name: name ? name.trim() : playlist.name,
      description: description ? description.trim() : playlist.description,
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, 'Failed to update playlist');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, 'Playlist updated successfully'));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistsById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};