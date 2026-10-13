const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Check if Cloudinary credentials are provided in environment
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Ensure local uploads directory exists (fallback for local development)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memoryStorage if Cloudinary is enabled, otherwise use diskStorage
const storage = hasCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination(req, file, cb) {
        cb(null, uploadDir);
      },
      filename(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `file-${uniqueSuffix}${ext}`);
      },
    });

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|svg|avif/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/');

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed!'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

// Helper to pipe memory buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'ecolink',
        public_id: `${Date.now()}-${path.parse(filename).name}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// @desc    Upload single image
// @route   POST /api/upload
// @access  Public / Protected (allow both)
router.post('/', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
    }

    try {
      if (hasCloudinary && req.file.buffer) {
        const result = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
        return res.json({
          success: true,
          message: 'Image uploaded to Cloudinary successfully',
          url: result.secure_url,
          filename: result.public_id,
        });
      }

      // Local disk fallback
      const relativePath = `/uploads/${req.file.filename}`;
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        url: relativePath,
        filename: req.file.filename,
      });
    } catch (uploadErr) {
      console.error('[UPLOAD ERROR]:', uploadErr);
      res.status(500).json({ success: false, message: uploadErr.message || 'Image upload failed' });
    }
  });
});

// @desc    Upload multiple images (up to 5 for reviews/products)
// @route   POST /api/upload/multiple
// @access  Public / Protected
router.post('/multiple', (req, res) => {
  upload.array('images', 5)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one image file to upload' });
    }

    try {
      if (hasCloudinary) {
        const uploadPromises = req.files.map((file) =>
          uploadBufferToCloudinary(file.buffer, file.originalname)
        );
        const results = await Promise.all(uploadPromises);
        const uploadedFiles = results.map((r) => ({
          url: r.secure_url,
          filename: r.public_id,
        }));
        return res.json({
          success: true,
          message: 'Images uploaded to Cloudinary successfully',
          count: uploadedFiles.length,
          files: uploadedFiles,
          urls: uploadedFiles.map((f) => f.url),
        });
      }

      // Local disk fallback
      const uploadedFiles = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
      }));
      res.json({
        success: true,
        message: 'Images uploaded successfully',
        count: uploadedFiles.length,
        files: uploadedFiles,
        urls: uploadedFiles.map((f) => f.url),
      });
    } catch (uploadErr) {
      console.error('[MULTIPLE UPLOAD ERROR]:', uploadErr);
      res.status(500).json({ success: false, message: uploadErr.message || 'Image upload failed' });
    }
  });
});

module.exports = router;
