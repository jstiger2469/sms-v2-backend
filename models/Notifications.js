const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const notificationSchema = new Schema({
  messageContent: {
    type: String,
    required: true, // The content of the message triggering the notification
  },
  senderName: {
    type: String,
    required: true, // Full name of the sender
  },
  recipientName: {
    type: String,
    required: true, // Full name of the recipient
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match', // Reference to the match context
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['Message Sent'], // Action triggering the notification
  },
  timestamp: {
    type: Date,
    default: Date.now, // Time of the triggering action
  },
  read: {
    type: Boolean,
    default: false, // Indicates if the admin has reviewed this notification
  },
});

const Notification = model('Notification', notificationSchema);

module.exports = Notification;
