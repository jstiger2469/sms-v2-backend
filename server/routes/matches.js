const express = require('express');
const mongoose = require('mongoose');
const Match = require('../models/Match');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const adminSMS = require('../utils/adminSMS');

const router = express.Router();

// Get all matches
router.get('/', async (req, res) => {
  try {
    //Retrive all Matches and populate messsages
    const matches = await Match.find({})
      .populate({
        path: 'messages',
        populate: [
          { path: 'sender', select: 'firstName lastName' }, // Populate sender within messages
          { path: 'recipient', select: 'firstName lastName' }, // Populate recipient within messages
        ],
      })
      .populate('messages.recipient', 'firstName lastName') // Populate recipient field in messages
      .populate('mentor', 'firstName lastName phone') // Populate mentor data in the match
      .populate('student', 'firstName lastName phone') // Populate student data in the match
      .exec();
    res.json(matches);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).send('Error retrieving matches');
  }
});

router.get('/:id', async (req, res) => {
  console.log('hit me');
  const { id } = req.params;
  console.log('Match ID:', id); // Log the ID for debugging

  // Validate the ObjectId format (to prevent invalid MongoDB ObjectId format)
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid match ID format' });
  }

  try {
    // Find the match by its ID and populate the references
    const match = await Match.findById(id)
      .populate('student') // Populate the student reference
      .populate('mentor') // Populate the mentor reference
      .populate('messages'); // Populate the messages reference
    // If the match doesn't exist, return a 404 error
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Return the match data as the response
    console.log(match);
    res.json(match);
  } catch (err) {
    console.error('Error fetching match:', err);
    res.status(500).json({ error: 'Server error retrieving match' });
  }
});

// Create a match
router.post('/create-match', async (req, res) => {
  const { studentData, mentorData } = req.body;
  // Validate phone numbers (at least 10 digits)
  const isValidPhone = (phone) => typeof phone === 'string' && phone.replace(/\D/g, '').length >= 10;
  if (!isValidPhone(studentData.phone) || !isValidPhone(mentorData.phone)) {
    return res.status(400).json({ message: 'Both student and mentor must have valid phone numbers with at least 10 digits.' });
  }
  try {
    console.log('Creating match with:', { studentData, mentorData });
    // Create student
    const student = new Student(studentData);
    await student.save();
    console.log('Student created:', student);

    // Create mentor
    const mentor = new Mentor(mentorData);
    await mentor.save();
    console.log('Mentor created:', mentor);

    // Create match
    const match = new Match({ student: student._id, mentor: mentor._id });
    await match.save();
    console.log('Match created:', match);

    // Send Welcome Message with Opt-In Request to both mentor and student
    const welcomeMsg = (user) => `Hello ${user.firstName} ${user.lastName} welcome to Seedling SMS please respond with START to begin using the service.\n\nHola ${user.firstName} ${user.lastName} ¡Bienvenidos a Seedling SMS! Responda con START para comenzar a usar el servicio.`;
    const normalize = (p) => {
      const d = String(p || '').replace(/\D/g, '');
      return d.length === 10 ? `+1${d}` : `+${d}`;
    };
    try {
      console.log('Sending welcome SMS to student:', student.phone, welcomeMsg(student));
      console.log('Sending welcome SMS to mentor:', mentor.phone, welcomeMsg(mentor));
      const results = await Promise.all([
        adminSMS(normalize(student.phone), welcomeMsg(student), 'Student', student._id),
        adminSMS(normalize(mentor.phone), welcomeMsg(mentor), 'Mentor', mentor._id)
      ]);
      console.log('Welcome SMS results:', results);
    } catch (smsErr) {
      console.error('Error sending welcome SMS:', smsErr);
      if (smsErr && smsErr.response) {
        console.error('Twilio error response:', smsErr.response);
      }
      // Continue even if SMS fails
    }

    res.status(201).json({
      match,
      student,
      mentor,
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Failed to create match' });
  }
});

router.delete('/delete-match/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    // Find the match by ID
    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Delete the corresponding student and mentor
    await Student.findByIdAndDelete(match.student);
    await Mentor.findByIdAndDelete(match.mentor);

    // Delete the match
    await Match.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: 'Match, student, and mentor deleted successfully' });
  } catch (error) {
    console.error('Error deleting match and related data:', error);
    res
      .status(500)
      .json({ message: 'Failed to delete match and related data' });
  }
});

module.exports = router;
 
// Resend opt-in/welcome SMS to both mentor and student for a match
router.post('/resend-opt-in/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const match = await Match.findById(id)
      .populate('student')
      .populate('mentor');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const welcomeMsg = (user) => `Hello ${user.firstName} ${user.lastName} welcome to Seedling SMS please respond with START to begin using the service.\n\nHola ${user.firstName} ${user.lastName} ¡Bienvenidos a Seedling SMS! Responda con START para comenzar a usar el servicio.`;

    const norm = (p) => {
      const d = String(p || '').replace(/\D/g, '');
      return d.length === 10 ? `+1${d}` : `+${d}`;
    };

    const results = await Promise.allSettled([
      adminSMS(norm(match.student.phone), welcomeMsg(match.student), 'Student', match.student._id),
      adminSMS(norm(match.mentor.phone), welcomeMsg(match.mentor), 'Mentor', match.mentor._id),
    ]);

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      return res.status(207).json({ message: 'Opt-in resend partially failed', results });
    }

    return res.status(200).json({ message: 'Opt-in messages resent successfully', results });
  } catch (error) {
    console.error('Error resending opt-in:', error);
    return res.status(500).json({ message: 'Failed to resend opt-in messages' });
  }
});

// Resend opt-in/welcome SMS to a specific participant (mentor|student)
router.post('/resend-opt-in/:id/:role', async (req, res) => {
  const { id, role } = req.params;
  try {
    if (role !== 'mentor' && role !== 'student') {
      return res.status(400).json({ message: 'Invalid role. Use "mentor" or "student".' });
    }

    const match = await Match.findById(id)
      .populate('student')
      .populate('mentor');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const user = role === 'mentor' ? match.mentor : match.student;
    const digits = String(user.phone || '').replace(/\D/g, '');
    if (digits.length < 10) {
      return res.status(400).json({ message: 'Invalid phone number for user' });
    }
    const welcomeMsg = (u) => `Hello ${u.firstName} ${u.lastName} welcome to Seedling SMS please respond with START to begin using the service.\n\nHola ${u.firstName} ${u.lastName} ¡Bienvenidos a Seedling SMS! Responda con START para comenzar a usar el servicio.`;

    const result = await adminSMS(user.phone, welcomeMsg(user), role === 'mentor' ? 'Mentor' : 'Student', user._id);
    return res.status(200).json({ message: `Opt-in message resent to ${role}.`, result });
  } catch (error) {
    console.error('Error resending opt-in (per user):', error);
    return res.status(500).json({ message: 'Failed to resend opt-in message' });
  }
});

// Set or toggle opt-in status for mentor or student on a match
router.put('/opt-in/:id/:role', async (req, res) => {
  const { id, role } = req.params;
  const { value } = req.body || {};
  try {
    if (role !== 'mentor' && role !== 'student') {
      return res.status(400).json({ message: 'Invalid role. Use "mentor" or "student".' });
    }

    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const key = role === 'mentor' ? 'mentorOptIn' : 'studentOptIn';
    if (typeof value === 'boolean') {
      match[key] = value;
    } else {
      match[key] = !match[key];
    }
    await match.save();

    return res.status(200).json({
      message: `${role} opt-in updated`,
      mentorOptIn: match.mentorOptIn,
      studentOptIn: match.studentOptIn,
    });
  } catch (error) {
    console.error('Error updating opt-in:', error);
    return res.status(500).json({ message: 'Failed to update opt-in' });
  }
});