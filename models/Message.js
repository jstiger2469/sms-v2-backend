const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// Define the Message Schema
const messageSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel', // This will point to either 'Student' or 'Mentor'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel', // This will point to either 'Student' or 'Mentor'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Student', 'Mentor'], // Indicates whether the sender is a Student or a Mentor
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Student', 'Mentor'], // Indicates whether the recipient is a Student or a Mentor
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match', // Reference to the Match collection
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Message = model('Message', messageSchema);

// Create the Message model
module.exports = Message;
