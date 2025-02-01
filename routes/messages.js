const express = require('express');
const Match = require('../models/Match'); // Ensure this path is correct
const Message = require('../models/Message');
const Mentor = require('../models/Mentor');
const Student = require('../models/Student');
const Notification = require('../models/Notifications'); // Assuming Notification model is in models/Notification
const adminSMS = require('../utils/adminSMS');
const inboundSMS = require('../utils/inboundSMS');
require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const twilioNumber = process.env.TWILIO_PHONE;
const { getIo } = require('../socket'); // Import getIo from socket.js

const router = express.Router();

/**
 * POST route to send an admin SMS
 */
router.post('/send-admin-sms', async (req, res) => {
  const { to, messageBody } = req.body;

  try {
    adminSMS(
      'Admin',
      to,
      messageBody,
      (response) => res.status(200).json({ success: true, data: response }),
      (error) => res.status(500).json({ success: false, error })
    );
  } catch (error) {
    console.error('Error in admin SMS route:', error);
    res.status(500).json({ success: false, error: 'Failed to send SMS' });
  }
});

/**
 * Add a message to the match and notify connected clients
 */
async function addMessageToMatch(obj) {
  try {
    const { content, match } = obj;

    if (!content || !match) {
      throw new Error(
        'Missing required fields: content, sender, recipient, or match ID.'
      );
    }

    // Step 1: Set up the sender/recipient models
    const senderModel = 'Mentor';
    const recipientModel = 'Student';
    const sender = match.mentor;
    const recipient = match.student;

    // Step 2: Create a new message
    const newMessage = new Message({
      content,
      sender,
      recipient,
      senderModel,
      recipientModel,
      match: match._id, // Associate the match ID
    });

    const savedMessage = await newMessage.save();
    console.log('New message saved:', savedMessage);

    // Step 3: Update the match with the new message ID
    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      { $push: { messages: savedMessage._id } }, // Push the new message ID
      { new: true } // Return the updated match document
    );

    if (!updatedMatch) {
      throw new Error('Match not found or unable to update.');
    }

    // Step 4: Fetch the sender and recipient names
    const senderName = await Mentor.findById(savedMessage.sender).exec();
    const recipientName = await Student.findById(savedMessage.recipient).exec();

    // Step 5: Create a notification for the new message
    const notification = new Notification({
      messageContent: savedMessage.content,
      senderName: senderName.firstName,
      recipientName: recipientName.firstName,
      matchId: match._id,
      action: 'Message Sent',
    });

    console.log('Notification:', notification);
    const savedNotification = await notification.save();

    // Step 6: Emit notification to all connected clients
    const io = getIo(); // Get the socket.io instance
    io.emit('new-notification', savedNotification);

    console.log('Match updated with new message ID:', updatedMatch);

    return { message: savedMessage, match: updatedMatch };
  } catch (error) {
    console.error('Error in addMessageToMatch:', error.message);
    throw error;
  }
}

/**
 * Add an SMS to the match and notify the recipient
 */
async function addSMSToMatch(obj) {
  try {
    const { content, match } = obj;

    if (!content || !match) {
      throw new Error(
        'Missing required fields: content, sender, recipient, or match ID.'
      );
    }

    // Step 1: Set up the sender/recipient models
    const senderModel = 'Student';
    const recipientModel = 'Mentor';
    const sender = match.student;
    const recipient = match.mentor;

    // Step 2: Create a new SMS message
    const newMessage = new Message({
      content,
      sender,
      recipient,
      senderModel,
      recipientModel,
      match: match._id, // Associate the match ID
    });

    const savedMessage = await newMessage.save();
    console.log('New SMS saved:', savedMessage);

    // Step 3: Update the match with the new SMS ID
    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      { $push: { messages: savedMessage._id } }, // Push the new message ID
      { new: true } // Return the updated match document
    );

    if (!updatedMatch) {
      throw new Error('Match not found or unable to update.');
    }

    // Step 4: Fetch the sender and recipient names
    const senderName = await Student.findById(savedMessage.sender).exec();
    const recipientName = await Mentor.findById(savedMessage.recipient).exec();

    // Step 5: Create a notification for the new SMS
    const notification = new Notification({
      messageContent: savedMessage.content,
      senderName: senderName.firstName,
      recipientName: recipientName.firstName,
      matchId: match._id,
      action: 'Message Sent',
    });

    console.log('Notification:', notification);
    const savedNotification = await notification.save();

    // Step 6: Emit notification to all connected clients
    const io = getIo(); // Get the socket.io instance
    io.emit('new-notification', savedNotification);

    console.log('Match updated with new SMS ID:', updatedMatch);

    return { message: savedMessage, match: updatedMatch };
  } catch (error) {
    console.error('Error in addSMSToMatch:', error.message);
    throw error;
  }
}

/**
 * Utility function to send SMS using Twilio
 */
function sendSMS(from, to, messageBody, callback, obj) {
  console.log(from, to, messageBody, obj);
  client.messages
    .create({
      body: messageBody,
      from: twilioNumber,
      to: to,
    })
    .then((message) => {
      console.log('Message sent successfully:', message.sid);
      return callback(obj); // Call the appropriate callback function after sending SMS
    })
    .catch((error) => {
      console.error('Error sending SMS:', error);
    });
}

/**
 * Handle opt-in and opt-out statuses
 */
async function optStatus(body, sender) {
  try {
    console.log('Received message:', body, 'Sender:', sender);

    // Step 1: Check if the sender is a Mentor or Student
    const mentor = await Mentor.findOne({ phone: sender }).exec();
    const student = mentor
      ? null
      : await Student.findOne({ phone: sender }).exec();

    if (!mentor && !student) {
      throw new Error('Sender not found in Mentor or Student collections');
    }

    // Step 2: Find the associated match for the sender
    let match, recipientDoc, senderDoc, recipientPhone;

    if (mentor) {
      match = await Match.findOne({ mentor: mentor._id }).exec();
      recipientDoc = await Student.findById(match.student).exec();
      recipientPhone = recipientDoc.phone;
      senderDoc = mentor;
    }

    // Step 3: Process the result
    processResult(
      match,
      body,
      sender,
      recipientPhone,
      recipientDoc.firstName,
      senderDoc.firstName,
      mentor ? addMessageToMatch : addSMSToMatch
    );
  } catch (error) {
    console.error('Error in optStatus:', error);
    throw error;
  }
}

/**
 * Process the message result and send if opt-ins are true
 */
function processResult(
  match,
  body,
  sender,
  recipient,
  senderName,
  recipientName,
  addMessageFunction
) {
  const msgObj = {
    content: body,
    sender,
    recipient,
    match: match,
  };

  if (match.mentorOptIn && match.studentOptIn) {
    console.log('Both opt-ins are true. Sending SMS and updating match.');
    sendSMS(sender, recipient, body, addMessageFunction, msgObj);
  } else {
    console.log('Opt-in conditions not met. Message not sent.');
  }
}

/**
 * Inbound SMS handler
 */
router.post('/inbound', (req, res) => {
  let finalSender;
  if (req.body.msisdn) {
    finalSender = req.body.msisdn.substr(1);
  } else {
    finalSender = req.body.From.substr(2);
  }

  const body = req.body.text || req.body.Body;
  const optIn = 'START';
  const optOut = 'STOP';

  console.log('Received body:', body);
  const trimmedBody = body.trimEnd();
  console.log('Trimmed body:', trimmedBody);

  // Step 1: Check for "START" or "STOP"
  if (trimmedBody.toUpperCase() === optIn) {
    console.log('Opt-in message:', trimmedBody);
    optInFunc(finalSender).catch(console.error);
  } else if (trimmedBody.toUpperCase() === optOut) {
    console.log('Opt-out message');
    optOutFunc(finalSender).catch(console.error);
  } else {
    console.log('Normal message:', trimmedBody);
    optStatus(trimmedBody, finalSender).catch(console.error);
  }

  res.status(200).end();
});

/**
 * Admin message route
 */
router.post('/admin-msg', async (req, res) => {
  const { recipientId, recipientType, message } = req.body;

  if (!recipientId || !recipientType || !message) {
    return res
      .status(400)
      .json({ success: false, error: 'Missing required fields.' });
  }

  try {
    let recipient;
    if (recipientType === 'Student') {
      recipient = await Student.findById(recipientId);
    } else if (recipientType === 'Mentor') {
      recipient = await Mentor.findById(recipientId);
    } else {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid recipient type.' });
    }

    if (!recipient) {
      return res
        .status(404)
        .json({ success: false, error: 'Recipient not found.' });
    }

    const recipientName = recipient.firstName || 'User';
    const recipientPhone = recipient.phone;

    if (!recipientPhone) {
      return res.status(400).json({
        success: false,
        error: 'Recipient does not have a phone number.',
      });
    }

    const messageContent = `Dear ${recipientName}, ${message}`;

    await sendAdminMessage(
      recipientName,
      recipientPhone,
      messageContent,
      recipientType,
      recipientId
    );

    res
      .status(200)
      .json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error in admin-msg route:', error);
    res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
});

module.exports = router;
