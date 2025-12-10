const express = require('express');
const apiKeyAuth = require('../../middleware/auth');
const Student = require('../../models/Student');
const Mentor = require('../../models/Mentor');
const Match = require('../../models/Match');
const adminSMS = require('../../utils/adminSMS');

const router = express.Router();

// All routes here are protected by API Key
router.use(apiKeyAuth);

/**
 * POST /api/v1/students
 * Create a student in the organization
 */
router.post('/students', async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    const organization = req.organization._id;

    // Basic validation
    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const student = new Student({
      firstName,
      lastName,
      phone,
      email,
      organization
    });

    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

/**
 * POST /api/v1/matches
 * Create a match between a student and mentor
 */
router.post('/matches', async (req, res) => {
  try {
    const { studentId, mentorId } = req.body;
    const organization = req.organization._id;

    // Verify ownership
    const student = await Student.findOne({ _id: studentId, organization });
    const mentor = await Mentor.findOne({ _id: mentorId, organization });

    if (!student || !mentor) {
      return res.status(404).json({ error: 'Student or Mentor not found in this organization' });
    }

    const match = new Match({
      student: studentId,
      mentor: mentorId,
      organization,
      mentorOptIn: false,
      studentOptIn: false
    });

    await match.save();

    // Trigger Welcome SMS (White-label capable)
    const welcomeMsg = req.organization.settings.welcomeMessage || 
      `Welcome to ${req.organization.name} SMS! Reply START to begin.`;
    
    // Send invites (fire and forget)
    adminSMS(student.phone, welcomeMsg, 'Student', student._id).catch(console.error);
    adminSMS(mentor.phone, welcomeMsg, 'Mentor', mentor._id).catch(console.error);

    res.status(201).json(match);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

module.exports = router;

