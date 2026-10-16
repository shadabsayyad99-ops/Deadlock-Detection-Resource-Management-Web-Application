const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const processRoutes = require('./routes/processRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const deadlockRoutes = require('./routes/deadlockRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/deadlock', deadlockRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DeadLockGuard Backend API</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc;">
        <div style="text-align: center; max-width: 500px; padding: 2.5rem; background: #1e293b; border-radius: 1.5rem; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛡️</div>
          <h1 style="color: #38bdf8; margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 800;">DeadLockGuard API Server</h1>
          <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1.5rem 0;">
            The backend API is running smoothly on port 5000.<br/>
            To use the web application, visit the frontend on <strong>port 3000</strong>.
          </p>
          <a href="http://localhost:3000" style="display: inline-block; padding: 0.8rem 1.8rem; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 0.75rem; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
            Open Application UI (localhost:3000) &rarr;
          </a>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', system: 'DeadLockGuard Platform', time: new Date() });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/deadlock_system';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB database successfully.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Starting server in fallback standalone mode (without database write persistence)...');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (Database disconnected status)`);
    });
  });
