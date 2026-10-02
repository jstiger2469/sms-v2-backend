const mongoose = require('mongoose');
const { normalizePhone } = require('../utils/phone');
const { Schema, model } = mongoose; // Make sure to import both Schema and model from mongoose

// Define the Student Schema
const studentSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String },
  // Stored as 10 digits so inbound SMS (START/STOP) lookups always match
  phone: { type: String, set: (v) => normalizePhone(v) || v },
});

// Create and export the Student model
const Student = model('Student', studentSchema);
module.exports = Student;
