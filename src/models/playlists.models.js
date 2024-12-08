import mongoose, { Schema } from "mongoose";

const playlistsSchema = Schema({
  name:{
    type: String,
    required: true,
    unique: true,
  },
  description:{
    type: String,
    required: true,
  },
  videos: [{
    type: Schema.Types.ObjectId,
    ref: "Video",
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, {timestamps: true});

export const Playlists = mongoose.model("Playlists", playlistsSchema);