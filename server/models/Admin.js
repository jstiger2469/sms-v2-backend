// models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true }, // or email
  name: String
});

module.exports = mongoose.model('Admin', adminSchema);
