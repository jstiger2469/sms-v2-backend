const { Server } = require('socket.io');
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000', // Allow frontend access
      methods: ['GET', 'POST'],
      credentials: true, // Allow authentication headers and cookies
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for new notifications
    socket.on('new-notification', (notification) => {
      console.log('New notification received:', notification);
      io.emit('new-notification', notification); // Broadcast to all clients
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized.');
  }
  return io;
};

module.exports = { initSocket, getIo };
