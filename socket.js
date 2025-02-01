const socketIo = require('socket.io');
let io;

const initSocket = (server) => {
  io = socketIo(server);
  io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for events from the frontend (e.g., new notification)
    socket.on('new-notification', (notification) => {
      console.log('New notification received:', notification);
      // Broadcast the notification to all connected clients
      io.emit('new-notification', notification);
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log('User disconnected');
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
