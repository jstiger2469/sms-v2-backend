const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket'); // Import socket initialization

const matchesRouter = require('./routes/matches'); // Import matches router
const mentorRouter = require('./routes/mentors'); // Import mentors router
const studentRouter = require('./routes/students'); // Import students router
const messagesRouter = require('./routes/messages'); // Import messages router
const adminRouter = require('./routes/admin'); // Import admin router

const app = express();

const corsOptions = {
  origin: '*', // Allow frontend access
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true, // Allow cookies and auth headers
};

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors(corsOptions));

// Middleware for parsing JSON and form-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define API routes for different entities
app.use('/matches', matchesRouter); // Matches API
app.use('/mentors', mentorRouter); // Mentors API
app.use('/students', studentRouter); // Students API
app.use('/api', messagesRouter); // Messages API
app.use('/admin', adminRouter); // Admin API (corrected)

// Only connect to MongoDB if NOT in test environment
if (process.env.NODE_ENV !== 'test') {
  console.log('not equal ', process.env.NODE_ENV)
  require('./db/connection'); // This will handle the connection
}

// Create the HTTP server with express
const server = http.createServer(app);

// Initialize socket.io with the HTTP server
initSocket(server);

// Set the port for the server
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
