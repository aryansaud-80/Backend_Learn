import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

userSchema.pre('save', async function (next) {
  if (!this.modified('password')) return next();
  this.password = bcrypt.hash(this.password, 10);

  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  jwt.sign(
    {
      id: this._id,
      email: this.email,
      username: this.username,
    },
    process.ACCESS_TOKEN_SECRET,
    { expiresIn: process.ACCESS_TOKEN_LIFE }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_LIFE }
  );
};

export const User = mongoose.model('User', userSchema);
