const mongoose = require('mongoose');
const { Schema } = mongoose;

const matchSchema = new Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true,
  },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  mentorOptIn: { type: Boolean, default: false },
  studentOptIn: { type: Boolean, default: false },
  lastMessageAt: { type: Date },
  healthScore: { type: Number, min: 0, max: 100, default: 100 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamps automatically on save
matchSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
