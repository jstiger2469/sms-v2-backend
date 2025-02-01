const express = require('express');
const mongoose = require('mongoose');
const Match = require('../models/Match');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');

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
      .populate('mentor', 'firstName lastName') // Populate mentor data in the match
      .populate('student', 'firstName lastName') // Populate student data in the match
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
  try {
    // Create student
    const student = new Student(studentData);
    await student.save();

    // Create mentor
    const mentor = new Mentor(mentorData);
    await mentor.save();

    // Create match
    const match = new Match({ student: student._id, mentor: mentor._id });
    await match.save();

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
