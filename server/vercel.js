require('dotenv').config();
console.log('Loaded TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('Loaded TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'set' : 'missing');
console.log('Loaded TWILIO_PHONE:', process.env.TWILIO_PHONE);

const express = require('express');
const cors = require('cors');

const matchesRouter = require('./routes/matches');
const mentorRouter = require('./routes/mentors');
const studentRouter = require('./routes/students');
const messagesRouter = require('./routes/messages');
const adminRouter = require('./routes/admin');
const dashboardRouter = require('./routes/dashboard');

const app = express();

const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define API routes
app.use('/api/matches', matchesRouter);
app.use('/api/mentors', mentorRouter);
app.use('/api/students', studentRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Only connect to MongoDB if NOT in test environment
if (process.env.NODE_ENV !== 'test') {
  console.log('Connecting to MongoDB...');
  require('./db/connection');
}

// Export the Express app for Vercel
module.exports = app; 