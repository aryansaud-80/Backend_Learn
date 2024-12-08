import mongoose, { Schema } from 'mongoose';

const tweetSchema = Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 280,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const Tweet = mongoose.model('Tweet', tweetSchema);
