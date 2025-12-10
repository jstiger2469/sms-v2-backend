const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const crypto = require('crypto');

const organizationSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // e.g. 'ucla', 'red-cross'
  apiKey: { type: String, unique: true },
  webhookUrl: { type: String }, // For forwarding events to their systems
  createdAt: { type: Date, default: Date.now },
  settings: {
    themeColor: { type: String, default: '#4F46E5' },
    logoUrl: { type: String },
    welcomeMessage: { type: String }, // Custom welcome message override
  }
});

// Generate API Key on creation if not present
organizationSchema.pre('save', function (next) {
  if (!this.apiKey) {
    this.apiKey = 'sk_' + crypto.randomBytes(24).toString('hex');
  }
  next();
});

const Organization = model('Organization', organizationSchema);
module.exports = Organization;

