import { Router, Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { authenticate } from '../middleware/auth';

const router = Router();

function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

function handleImageUpload(req: Request, res: Response, next: NextFunction): void {
  upload.single('image')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: 'Image must be 5MB or smaller',
      });
      return;
    }
    if (err) {
      const message = err instanceof Error ? err.message : 'Invalid image';
      res.status(400).json({ success: false, error: message });
      return;
    }
    next();
  });
}

router.post(
  '/image',
  authenticate,
  handleImageUpload,
  async (req: Request, res: Response): Promise<void> => {
    if (!isCloudinaryConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Image upload is not configured',
      });
      return;
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
      return;
    }

    try {
      const result = await new Promise<{
        secure_url: string;
        public_id: string;
        width: number;
        height: number;
        format: string;
      }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'dfoodie/uploads',
          },
          (error, uploaded) => {
            if (error || !uploaded) {
              reject(error || new Error('Cloudinary returned no result'));
              return;
            }
            resolve(uploaded as {
              secure_url: string;
              public_id: string;
              width: number;
              height: number;
              format: string;
            });
          }
        ).end(file.buffer);
      });

      res.json({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Failed to upload image';
      res.status(502).json({ success: false, error: message || 'Failed to upload image' });
    }
  }
);

export default router;
