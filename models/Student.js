const mongoose = require('mongoose');
const { Schema, model } = mongoose; // Make sure to import both Schema and model from mongoose

// Define the Student Schema
const studentSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
});

// Create and export the Student model
const Student = model('Student', studentSchema);
module.exports = Student;
