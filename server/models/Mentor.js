const mongoose = require('mongoose');
const { normalizePhone } = require('../utils/phone');
const { Schema, model } = mongoose; // Correctly import Schema and model from mongoose

// Define the Mentor Schema
const mentorSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String },
  // Stored as 10 digits so inbound SMS (START/STOP) lookups always match
  phone: { type: String, set: (v) => normalizePhone(v) || v, required: true, unique: true },
});

// Create and export the Mentor model
const Mentor = model('Mentor', mentorSchema);
module.exports = Mentor;
