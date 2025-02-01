const mongoose = require('mongoose');
const { Schema, model } = mongoose; // Correctly import Schema and model from mongoose

// Define the Mentor Schema
const mentorSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true, unique: true },
});

// Create and export the Mentor model
const Mentor = model('Mentor', mentorSchema);
module.exports = Mentor;
