import mongoose, { Schema } from 'mongoose';

const userSchema = Schema(
  {
    username: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      required: true,
      default: 'https://via.placeholder.com/150',
    },
    banner: {
      type: String,
      required: true,
      default: 'https://via.placeholder.com/150',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    refreshToken: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
