import multer from "multer";
import path from "path";
import fs from 'fs';
import { AuthenticatedRequest } from "../constants/AuthenticatedRequest";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../public/uploads');

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req: AuthenticatedRequest, file, cb) {
    const timestamp = Date.now();
    const userId = req.user.userId;
    const randomNum = Math.floor(Math.random() * 10000);
    const fileExt = path.extname(file.originalname).toLowerCase();

    cb(null, `avatar_${timestamp}_${userId}_${randomNum}${fileExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB file size limit
    files: 1, // Only allow 1 file at a time
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});