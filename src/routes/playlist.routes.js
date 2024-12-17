import { Router } from 'express';
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistsById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from '../controllers/playlist.controller.js';
import { jwtVerifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/create-playlist').post(jwtVerifyToken, createPlaylist);
router.route('/get-user-playlists/:userId').get(getUserPlaylists);
router.route('/get-playlist/:playlistId').get(getPlaylistsById);
router
  .route('/add-video-to-playlist/:playlistId/:videoId')
  .put(jwtVerifyToken, addVideoToPlaylist);
router.route("/remove-video-from-playlist/:playlistId/:videoId").put(jwtVerifyToken, removeVideoFromPlaylist);
router.route("/delete-playlist/:playlistId").delete(jwtVerifyToken, deletePlaylist);
router.route("/update-playlist/:playlistId").put(jwtVerifyToken, updatePlaylist);

export default router;
