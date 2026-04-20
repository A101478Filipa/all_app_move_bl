import multer from "multer";
import path from "path";
import fs from 'fs';
import { AuthenticatedRequest } from "../constants/AuthenticatedRequest";

const uploadDir = path.join(__dirname, '../../../public/uploads');

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: function (req: AuthenticatedRequest, file, cb) {
    const timestamp = Date.now();
    const userId = req.user.userId;
    const randomNum = Math.floor(Math.random() * 10000);
    const fileExt = path.extname(file.originalname).toLowerCase();

    cb(null, `avatar_${timestamp}_${userId}_${randomNum}${fileExt}`);
  }
});

const injuryPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: function (req: AuthenticatedRequest, file, cb) {
    const timestamp = Date.now();
    const userId = req.user?.userId ?? 0;
    const randomNum = Math.floor(Math.random() * 10000);
    const fileExt = path.extname(file.originalname).toLowerCase();
    cb(null, `injury_${timestamp}_${userId}_${randomNum}${fileExt}`);
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

export const uploadIncidentPhoto = multer({
  storage: injuryPhotoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 10MB limit for injury photos
    files: 1,
    fieldSize: 1024 * 1024,
  }
});