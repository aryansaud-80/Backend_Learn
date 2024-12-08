import mongoose, { Schema } from 'mongoose';

const likesSchema = Schema(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    vedio: {
      type: Schema.Types.ObjectId,
      ref: 'Vedio',
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: 'Tweet',
    },
  },
  { timestamps: true }
);

export const Likes = mongoose.model('Likes', likesSchema);