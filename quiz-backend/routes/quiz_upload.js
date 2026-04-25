const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Public upload endpoint — no auth needed (customers uploading photos in quiz)
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `response_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max for customer uploads
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// POST /api/quiz/upload  — customer uploads a photo during quiz
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
  // Return a relative path — the frontend will resolve it against the backend base URL
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
