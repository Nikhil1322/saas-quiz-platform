const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h) return res.status(403).json({ msg: 'No token' });
  try { req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ msg: 'Invalid token' }); }
};

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `img_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// POST /api/upload  — upload an image, returns its public URL
router.post('/', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
  // Return the URL path — frontend will prepend the correct base URL
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
