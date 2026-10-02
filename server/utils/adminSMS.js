const { toE164 } = require('./phone');
const Message = require('../models/Message');
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'set' : 'missing');
console.log('TWILIO_PHONE:', process.env.TWILIO_PHONE);

const adminSMS = async (recipientPhone, messageContent, recipientModel, recipientId) => {
  try {
    const to = toE164(recipientPhone);
    if (!to) throw new Error(`Invalid phone number: ${recipientPhone}`);
    console.log('[adminSMS] Params:', { recipientPhone: to, recipientModel, recipientId });
    const response = await client.messages.create({
      body: messageContent,
      from: process.env.TWILIO_PHONE,
      to,
    });

    console.log(`[adminSMS] Message successfully sent to ${recipientPhone}. SID: ${response.sid}`);
    console.log('[adminSMS] Twilio response:', response);
    // No DB save for welcome/admin messages
    return { twilioSid: response.sid };
  } catch (error) {
    console.error('[adminSMS] Error sending SMS:', error);
    throw error;
  }
};

module.exports = adminSMS;