import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentsSchema = Schema(
  {
    content: {
      type: String,
      required: true,
    },
    vedio: {
      type: Schema.Types.ObjectId,
      ref: 'Vedio',
      required: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  },
  { timestamps: true }
);

commentsSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model('Comment', commentsSchema);
