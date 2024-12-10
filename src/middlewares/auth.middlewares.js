import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utilities/asyncHandler.js';
import { ApiError } from '../utilities/ApiError.js';
import { User } from '../models/users.models.js';

const jwtVerifyToken = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies.accessToken ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  try {
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, 'Unauthorized');
  }
});

export { jwtVerifyToken };
