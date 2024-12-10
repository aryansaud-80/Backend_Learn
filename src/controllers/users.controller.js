import { asyncHandler } from '../utilities/asyncHandler.js';
import { User } from '../models/users.models.js';
import { ApiError } from '../utilities/ApiError.js';
import { ApiResponse } from '../utilities/ApiResponse.js';
import {
  cloudinaryUpload,
  cloudinaryDelete,
} from '../utilities/cloudinaryUpload.js';

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

export const loginUser = asyncHandler(async(req, res, next) =>{
  if(!req.body){
    throw new ApiError(400, 'No data provided');
  }

  const {email, password} = req.body;

  if([email, password].some((field) => field === '')){
    throw new ApiError(400, 'All fields are required');
  }

  const user = await User.findOne({email});

  if(!user){
    throw new ApiError(404, 'User not found');
  }

  const isPasswordMatch = await user.comparePassword(password);

  if(!isPasswordMatch){
    throw new ApiError(401, 'Invalid Password');
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

  // console.table({accessToken, refreshToken});

  const option = {
    httpOnly: true,
    secure: false,
  };

  return res.status(200)
  .cookie('refreshToken', refreshToken, option)
  .cookie('accessToken', accessToken, option)
  .json(new ApiResponse(200, {refreshToken, accessToken}, "Login successful"));
})
