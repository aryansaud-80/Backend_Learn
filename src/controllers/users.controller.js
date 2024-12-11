import { asyncHandler } from '../utilities/asyncHandler.js';
import { User } from '../models/users.models.js';
import { ApiError } from '../utilities/ApiError.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import {
  cloudinaryUpload,
  cloudinaryDelete,
} from '../utilities/cloudinaryUpload.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const registerUser = asyncHandler(async (req, res, next) => {
  if (!req.body) {
    throw new ApiError(400, 'No data provided');
  }
  const { fullname, username, email, password } = req.body;

  if ([fullname, username, email, password].some((field) => field === '')) {
    throw new ApiError(400, 'All fields are required');
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(400, 'Email or Username already exists');
  }

  const avatarlocalpath = req.files?.avatar?.[0]?.path;
  const coverImagelocalpath = req.files?.coverImage?.[0]?.path;

  let avatar;
  try {
    const avatarUpload = await cloudinaryUpload(avatarlocalpath);
    avatar = avatarUpload;
  } catch (error) {
    throw new ApiError(400, 'Invalid file type');
  }

  let coverImage;
  try {
    const coverImageUpload = await cloudinaryUpload(coverImagelocalpath);
    coverImage = coverImageUpload;
  } catch (error) {
    throw new ApiError(400, 'Invalid file type');
  }

  // console.log('Avatar:', avatar);

  try {
    const user = await User.create({
      username: username.toLowerCase(),
      fullname,
      email,
      password,
      avatar: avatar.url || '',
      banner: coverImage.url || '',
    });

    const registeredUser = await User.findById(user._id).select(
      '-password -refreshToken'
    );

    if (!registeredUser) {
      throw new ApiError(500, 'Error registering user');
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, 'User registered successfully', registeredUser)
      );
  } catch (error) {
    console.error('Error: ', error);
    if (avatar) {
      await cloudinaryDelete(avatar.public_id);
    }
    if (coverImage) {
      await cloudinaryDelete(coverImage.public_id);
    }
    throw new ApiError(500, 'Error registering user');
  }
});

export const loginUser = asyncHandler(async (req, res, next) => {
  if (!req.body) {
    throw new ApiError(400, 'No data provided');
  }

  const { email, password } = req.body;

  if ([email, password].some((field) => field === '')) {
    throw new ApiError(400, 'All fields are required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid Password');
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  if (!loggedInUser) {
    throw new ApiError(500, 'Error logging in user');
  }

  // console.table({accessToken, refreshToken});

  const option = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .cookie('refreshToken', refreshToken, option)
    .cookie('accessToken', accessToken, option)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, refreshToken, accessToken },
        'Login successful'
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie('refreshToken', option)
    .clearCookie('accessToken', option)
    .json(new ApiResponse(200, null, 'logout successful'));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, 'No refresh token provided');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, 'Refresh token is invalid');
    }

    const option = {
      httpOnly: true,
      secure: false,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie('refreshToken', newRefreshToken, option)
      .cookie('accessToken', accessToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed successfully'
        )
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || '401',
      error.message || 'Invalid refresh token'
    );
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new ApiError(400, 'No data provided');
  }

  const { currentPassword, newPassword } = req.body;

  if ([currentPassword, newPassword].some((field) => field === '')) {
    throw new ApiError(400, 'All fields are required');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordMatch = await user.comparePassword(currentPassword);

  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid Password');
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Password changed successfully'));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    '-password -refreshToken'
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(new ApiResponse(200, user, 'Current User found'));
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if ([fullname, email].some((field) => field === '')) {
    throw new ApiError(400, 'All fields are required');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User profile updated successfully'));
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarlocalpath = req.file?.path;

  if (!avatarlocalpath) {
    throw new ApiError(400, 'No file provided');
  }

  let avatar;
  try {
    avatar = await cloudinaryUpload(avatarlocalpath);
  } catch (error) {
    cloudinaryDelete(avatar.public_id);
    throw new ApiError(400, 'Invalid file type');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url || '',
      },
    },
    {
      new: true,
    }
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User avatar updated successfully'));
});

export const updateUserBanner = asyncHandler(async (req, res) => {
  const coverImagelocalpath = req.file?.path;

  console.log('Cover Image:', coverImagelocalpath);

  if (!coverImagelocalpath) {
    throw new ApiError(400, 'No file provided');
  }

  let coverImage;

  try {
    coverImage = await cloudinaryUpload(coverImagelocalpath);
  } catch (error) {
    await cloudinaryDelete(coverImage.public_id);
    throw new ApiError(400, 'Invalid file type');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        banner: coverImage.url || '',
      },
    },
    {
      new: true,
    }
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User banner updated successfully'));
});
