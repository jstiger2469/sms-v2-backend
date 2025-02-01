const express = require('express');
const cors = require('cors');
const http = require('http'); // Import the http module
const { initSocket } = require('./socket'); // Import socket initialization

const matchesRouter = require('./routes/matches'); // Import matches router
const mentorRouter = require('./routes/mentors'); // Import mentors router
const studentRouter = require('./routes/students'); // Import students router
const messagesRouter = require('./routes/messages'); // Import messages router
const adminRouter = require('./routes/admin'); // Import admin router

const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Middleware for parsing JSON and form-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define API routes for different entities
app.use('/matches', matchesRouter); // Matches API
app.use('/mentors', mentorRouter); // Mentors API
app.use('/students', studentRouter); // Students API
app.use('/api', messagesRouter); // Messages API
app.use('/admin', adminRouter); // Admin API (corrected)

// Establish the database connection
require('./db/connection');

// Create the HTTP server with express
const server = http.createServer(app);

// Initialize socket.io with the HTTP server
initSocket(server);

// Set the port for the server
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
