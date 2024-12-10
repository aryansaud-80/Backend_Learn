import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, './public/temp');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.originalname + '-' + uniqueSuffix);
  },
});


export const upload = multer({
  storage
})