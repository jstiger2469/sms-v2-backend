const express = require('express');
const Match = require('../models/Match'); // Ensure this path is correct
const Message = require('../models/Message');
const Mentor = require('../models/Mentor');
const Student = require('../models/Student');
const Notification = require('../models/Notifications'); // Assuming Notification model is in models/Notification
const adminSMS = require('../utils/adminSMS');
const inboundSMS = require('../utils/inboundSMS');
const { optInFunc } = require('../utils/helpers');
const pulseService = require('../services/pulse.service');
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
  console.log(req.body)
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

    // Step 3: Update the match with the new message ID and timestamp
    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      { 
        $push: { messages: savedMessage._id },
        $set: { lastMessageAt: new Date() }
      }, // Push the new message ID and update timestamp
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

    // Fire-and-forget sentiment analysis
    pulseService.processMessageSentiment(match._id, content).catch(err => 
      console.error('Background sentiment analysis error:', err)
    );

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
    console.log('=== ADD SMS TO MATCH (STUDENT -> MENTOR) ===');
    const { content, match } = obj;

    if (!content || !match) {
      console.error('ERROR: Missing required fields in addSMSToMatch');
      throw new Error(
        'Missing required fields: content, sender, recipient, or match ID.'
      );
    }

    console.log('Content:', content);
    console.log('Match ID:', match._id);

    // Step 1: Set up the sender/recipient models
    const senderModel = 'Student';
    const recipientModel = 'Mentor';
    const sender = match.student;
    const recipient = match.mentor;

    console.log('Sender (Student) ID:', sender);
    console.log('Recipient (Mentor) ID:', recipient);

    // Step 2: Create a new SMS message
    console.log('Step 2: Creating new SMS message...');
    const newMessage = new Message({
      content,
      sender,
      recipient,
      senderModel,
      recipientModel,
      match: match._id, // Associate the match ID
    });

    const savedMessage = await newMessage.save();
    console.log('✅ New SMS saved with ID:', savedMessage._id);

    // Step 3: Update the match with the new SMS ID
    console.log('Step 3: Updating match with new message...');
    const updatedMatch = await Match.findByIdAndUpdate(
      match._id,
      { 
        $push: { messages: savedMessage._id },
        $set: { lastMessageAt: new Date() }
      }, // Push the new message ID and update timestamp
      { new: true } // Return the updated match document
    );

    if (!updatedMatch) {
      console.error('ERROR: Match not found or unable to update');
      throw new Error('Match not found or unable to update.');
    }

    console.log('✅ Match updated with new message ID');

    // Step 4: Fetch the sender and recipient names
    console.log('Step 4: Fetching sender and recipient names...');
    const senderName = await Student.findById(savedMessage.sender).exec();
    const recipientName = await Mentor.findById(savedMessage.recipient).exec();

    console.log('Sender name:', senderName.firstName + ' ' + senderName.lastName);
    console.log('Recipient name:', recipientName.firstName + ' ' + recipientName.lastName);

    // Step 5: Create a notification for the new SMS
    console.log('Step 5: Creating notification...');
    const notification = new Notification({
      messageContent: savedMessage.content,
      senderName: senderName.firstName,
      recipientName: recipientName.firstName,
      matchId: match._id,
      action: 'Message Sent',
    });

    console.log('Notification object created:', notification);
    const savedNotification = await notification.save();
    console.log('✅ Notification saved with ID:', savedNotification._id);

    // Step 6: Emit notification to all connected clients
    console.log('Step 6: Emitting notification to connected clients...');
    const io = getIo(); // Get the socket.io instance
    io.emit('new-notification', savedNotification);
    console.log('✅ Notification emitted to all clients');

    console.log('✅ STUDENT -> MENTOR MESSAGE FLOW COMPLETED SUCCESSFULLY');

    // Fire-and-forget sentiment analysis
    pulseService.processMessageSentiment(match._id, content).catch(err => 
      console.error('Background sentiment analysis error:', err)
    );

    return { message: savedMessage, match: updatedMatch };
  } catch (error) {
    console.error('❌ ERROR in addSMSToMatch:', error.message);
    throw error;
  }
}

/**
 * Utility function to send SMS using Twilio
 */
function sendSMS(from, to, messageBody, callback, obj) {
  console.log('=== SEND SMS FUNCTION ===');
  console.log('From phone:', from);
  console.log('To phone:', to);
  console.log('Message body:', messageBody);
  console.log('Callback function:', callback.name);

  const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  console.log('Twilio client created, sending SMS...');

  // Normalize destination to E.164
  const digits = String(to || '').replace(/\D/g, '');
  const toE164 = digits.length === 10 ? `+1${digits}` : `+${digits}`;

  client.messages
    .create({
      body: messageBody,
      from: process.env.TWILIO_PHONE,
      to: toE164,
    })
    .then((message) => {
      console.log('✅ SMS sent successfully via Twilio!');
      console.log('Twilio message SID:', message.sid);
      console.log('Message status:', message.status);
      console.log('Calling callback function:', callback.name);
      return callback(obj); // Call the appropriate callback function after sending SMS
    })
    .catch((error) => {
      console.error('❌ ERROR sending SMS via Twilio:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error);
    });
}

/**
 * Handle opt-in and opt-out statuses with Smart Routing (Topic-Based)
 */
async function optStatus(body, sender) {
  try {
    console.log('=== STUDENT/MENTOR MESSAGE FLOW START ===');
    console.log('Received message:', body, 'Sender phone:', sender);

    // Step 1: Check if the sender is a Mentor or Student
    console.log('Step 1: Looking up sender in database...');
    const mentor = await Mentor.findOne({ phone: sender }).exec();
    const student = mentor
      ? null
      : await Student.findOne({ phone: sender }).exec();

    console.log('Mentor found:', mentor ? mentor.firstName + ' ' + mentor.lastName : 'No mentor found');
    console.log('Student found:', student ? student.firstName + ' ' + student.lastName : 'No student found');

    if (!mentor && !student) {
      console.error('ERROR: Sender not found in Mentor or Student collections');
      throw new Error('Sender not found in Mentor or Student collections');
    }

    // Step 2: Smart Routing Logic
    let match, recipientDoc, senderDoc, recipientPhone;

    // Detect hashtag for routing (e.g. #financial, #career)
    const hashtagMatch = body.match(/^#(\w+)/);
    const topic = hashtagMatch ? hashtagMatch[1].toLowerCase() : null;

    if (mentor) {
      // Mentor sending: Route to the student they are matched with (1:1 for now, or last active)
      // Future: If mentor has multiple students, we might need a "Reply-To" context or last-message thread
      console.log('Processing MENTOR sending message...');
      // Find matches for this mentor, sort by last active
      const matches = await Match.find({ mentor: mentor._id }).sort({ lastMessageAt: -1 }).exec();
      
      if (!matches || matches.length === 0) {
        console.error('ERROR: No match found for mentor:', mentor.firstName);
        throw new Error('No match found for mentor');
      }

      // Default to most recent match
      match = matches[0];
      
      recipientDoc = await Student.findById(match.student).exec();
      recipientPhone = recipientDoc.phone;
      senderDoc = mentor;
      console.log('Match selected (Mentor -> Student):', mentor.firstName, '->', recipientDoc.firstName);

    } else if (student) {
      // Student sending: Check for topic routing
      console.log('Processing STUDENT sending message...');
      
      const matches = await Match.find({ student: student._id })
        .populate('mentor')
        .sort({ lastMessageAt: -1 })
        .exec();

      if (!matches || matches.length === 0) {
        console.error('ERROR: No match found for student:', student.firstName);
        throw new Error('No match found for student');
      }

      if (topic) {
        console.log(`Topic detected: #${topic}. Searching for specialist...`);
        // Find a mentor in the student's matches who has this specialty
        const specialistMatch = matches.find(m => 
          m.mentor && m.mentor.specialties && m.mentor.specialties.map(s => s.toLowerCase()).includes(topic)
        );

        if (specialistMatch) {
          match = specialistMatch;
          console.log(`✅ Specialist found for #${topic}:`, match.mentor.firstName);
        } else {
          console.log(`⚠️ No specialist found for #${topic}. Falling back to primary.`);
          match = matches[0]; // Fallback to primary/last active
        }
      } else {
        // No topic, route to primary (last active)
        match = matches[0];
      }

      recipientDoc = await Mentor.findById(match.mentor).exec();
      recipientPhone = recipientDoc.phone;
      senderDoc = student;
      console.log('Match selected (Student -> Mentor):', student.firstName, '->', recipientDoc.firstName);
    }

    console.log('Recipient phone:', recipientPhone);
    console.log('Opt-in status - Mentor:', match.mentorOptIn, 'Student:', match.studentOptIn);

    // Step 3: Process the result
    console.log('Step 3: Processing message result...');
    processResult(
      match,
      body,
      sender,
      recipientPhone,
      senderDoc.firstName,
      recipientDoc.firstName,
      mentor ? addMessageToMatch : addSMSToMatch
    );
  } catch (error) {
    console.error('ERROR in optStatus:', error.message);
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
  console.log('=== PROCESS RESULT FUNCTION ===');
  console.log('Sender phone:', sender);
  console.log('Recipient phone:', recipient);
  console.log('Sender name:', senderName);
  console.log('Recipient name:', recipientName);
  console.log('Message body:', body);
  console.log('Opt-in status - Mentor:', match.mentorOptIn, 'Student:', match.studentOptIn);

  const msgObj = {
    content: body,
    sender,
    recipient,
    match: match,
  };

  if (match.mentorOptIn && match.studentOptIn) {
    console.log('✅ Both opt-ins are true. Sending SMS and updating match.');
    console.log('Calling function:', addMessageFunction.name);
    sendSMS(sender, recipient, body, addMessageFunction, msgObj);
  } else {
    console.log('❌ Opt-in conditions not met. Message not sent.');
    console.log('Mentor opt-in:', match.mentorOptIn);
    console.log('Student opt-in:', match.studentOptIn);
  }
}

/**
 * Inbound SMS handler
 */
router.post('/inbound', (req, res) => {
  console.log('=== INBOUND SMS RECEIVED ===');
  console.log('Request body:', req.body);
  
  // Normalize sender to 10-digit for DB lookup
  const rawSender = req.body.msisdn || req.body.From || '';
  const digits = String(rawSender).replace(/\D/g, '');
  const finalSender = digits.length === 11 && digits.startsWith('1')
    ? digits.slice(1)
    : digits;

  const body = req.body.text || req.body.Body;
  const optIn = 'START';
  const optOut = 'STOP';

  console.log('Final sender phone:', finalSender);
  console.log('Received body:', body);
  const trimmedBody = body.trimEnd();
  console.log('Trimmed body:', trimmedBody);

  // Step 1: Check for "START" or "STOP"
  if (trimmedBody.toUpperCase() === optIn) {
    console.log('🟢 Opt-in message detected:', trimmedBody);
    optInFunc(finalSender).catch(console.error);
  } else if (trimmedBody.toUpperCase() === optOut) {
    console.log('🔴 Opt-out message detected');
    optOutFunc(finalSender).catch(console.error);
  } else {
    console.log('💬 Normal message detected, processing...');
    optStatus(trimmedBody, finalSender).catch(console.error);
  }

  console.log('=== INBOUND SMS HANDLER COMPLETED ===');
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

// GET paginated messages
router.get('/messages', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [messages, totalCount] = await Promise.all([
      Message.find({})
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender')
        .populate('recipient')
        .lean(),
      Message.countDocuments({})
    ]);

    res.json({ messages, totalCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
