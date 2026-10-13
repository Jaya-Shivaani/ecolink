const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const businessRoutes = require('./routes/businessRoutes');
const communityRoutes = require('./routes/communityRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const statsRoutes = require('./routes/statsRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const { deleteExpiredEventsHelper } = require('./controllers/communityController');

const app = express();

// Connect Database
connectDB();

// Periodic background task to auto-delete expired workshops/events (in continuous environments)
if (!process.env.VERCEL) {
  setTimeout(() => {
    deleteExpiredEventsHelper();
  }, 5000);
  // Run cleanup every 30 minutes
  setInterval(() => {
    deleteExpiredEventsHelper();
  }, 30 * 60 * 1000);
}

// Enhanced CORS & Parsing Middleware
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000']
  : '*';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like server-to-server, mobile apps, or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins === '*' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback to prevent breaking CORS during initial deployment
    },
    credentials: true,
  })
);
app.use(express.json());

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Routes for Cloud Providers (Render, Railway, UptimeRobot)
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/testimonials', testimonialRoutes);

// Simple Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to EcoLink Hyperlocal API', status: 'online' });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
