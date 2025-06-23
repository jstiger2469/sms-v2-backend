const { Server } = require('socket.io');
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for new notifications
    socket.on('new-notification', (notification) => {
      console.log('New notification received');
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
