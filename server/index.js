require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket');

const matchesRouter = require('./routes/matches');
const mentorRouter = require('./routes/mentors');
const studentRouter = require('./routes/students');
const messagesRouter = require('./routes/messages');
const adminRouter = require('./routes/admin');
const dashboardRouter = require('./routes/dashboard');
const pulseRouter = require('./routes/pulse');
const publicApiRouter = require('./routes/api/v1');

const app = express();

// Production-ready CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/matches', matchesRouter);
app.use('/api/mentors', mentorRouter);
app.use('/api/students', studentRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/pulse', pulseRouter);
app.use('/api/v1', publicApiRouter); // Public API for integrations

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Connect to MongoDB if not in test environment
if (process.env.NODE_ENV !== 'test') {
  require('./db/connection');
}

const server = http.createServer(app);

// Initialize socket.io
initSocket(server);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
