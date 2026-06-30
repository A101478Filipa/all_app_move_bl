import multer from 'multer';

/**
 * Multer config for IMU binary payloads coming from the belt's SD card.
 *
 * We keep the file in memory (no disk staging) so the controller can write it
 * straight into the DB (`Bytes` field). With the current 100 Hz × 24 B sample
 * size, a 10-minute recording is ~1.4 MB — comfortably under the 50 MB cap.
 */
export const uploadDeviceSessionPayload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
    fieldSize: 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/octet-stream',
      'application/binary',
      'application/x-binary',
    ];
    if (!file.mimetype || allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid mimetype ${file.mimetype}; expected application/octet-stream`));
    }
  },
});
