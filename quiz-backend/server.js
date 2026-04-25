require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images publicly — two paths for backwards compatibility
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/img', express.static(path.join(__dirname, 'uploads')));  // alias for old stored URLs

app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/forms', require('./routes/forms'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/quiz', require('./routes/quiz_upload')); // public customer upload
app.use('/api/upload', require('./routes/upload'));    // builder upload (auth required)
app.use('/api/master', require('./routes/master'));    // super admin saas routes

app.listen(5000, () => console.log('Server running on port 5000'));